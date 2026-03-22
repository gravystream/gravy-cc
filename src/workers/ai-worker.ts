/**
 * Novaclio AI Quality Gate Worker (BullMQ)
 * Runs as a separate process: node -r ts-node/register src/workers/ai-worker.ts
 * Or add to PM2 ecosystem: { name: "ai-worker", script: "src/workers/ai-worker.ts", interpreter: "ts-node" }
 *
 * Processes two job types:
 *   check-proposal    — scores a creator's proposal video
 *   check-deliverable — scores a delivered job video
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { checkProposalQuality, checkDeliverableQuality } from "@/lib/ai";

const db = new PrismaClient();

const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// ── Proposal quality check ────────────────────────────────────────────────────
async function processProposal(job: Job) {
  const { proposalId } = job.data;
  console.log(`[AI Worker] Checking proposal ${proposalId}`);

  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: { campaign: true },
  });

  if (!proposal) {
    console.error(`[AI Worker] Proposal ${proposalId} not found`);
    return;
  }

  if (!proposal.pitchVideoUrl) {
    // No video — mark as not qualified
    await db.proposal.update({
      where: { id: proposalId },
      data: { status: "NOT_QUALIFIED", aiScore: 0, aiScoreBreakdown: {} },
    });
    return;
  }

  // Mark as under review
  await db.proposal.update({
    where: { id: proposalId },
    data: { status: "UNDER_AI_REVIEW" },
  });

  try {
    const result = await checkProposalQuality({
      proposalId,
      videoUrl: proposal.pitchVideoUrl,
      campaignBrief: proposal.campaign.description,
      pitchText: proposal.pitchText,
    });

    const qualified = result.overall >= 60;

    await db.$transaction(async (tx) => {
      const updatedProposal = await tx.proposal.update({
        where: { id: proposalId },
        data: {
          status: qualified ? "QUALIFIED" : "NOT_QUALIFIED",
          aiScore: result.overall,
          aiScoreBreakdown: result.breakdown as any,
        },
      });

      // Notify creator
      await tx.notification.create({
        data: {
          userId: proposal.creatorId,
          type: qualified ? "PROPOSAL_QUALIFIED" : "PROPOSAL_NOT_QUALIFIED",
          title: qualified ? "✅ Proposal qualified!" : "❌ Proposal did not qualify",
          body: qualified
            ? `Your proposal for "${proposal.campaign.title}" scored ${result.overall}/100 and passed AI review.`
            : `Your proposal for "${proposal.campaign.title}" scored ${result.overall}/100 (minimum 60 required).`,
          actionUrl: `/creator/proposals`,
        },
      });

      return updatedProposal;
    });

    console.log(`[AI Worker] Proposal ${proposalId} scored ${result.overall} → ${qualified ? "QUALIFIED" : "NOT_QUALIFIED"}`);
  } catch (err) {
    console.error(`[AI Worker] Error checking proposal ${proposalId}:`, err);
    // Revert to SUBMITTED on error so it can be retried
    await db.proposal.update({
      where: { id: proposalId },
      data: { status: "SUBMITTED" },
    });
    throw err; // BullMQ will retry
  }
}

// ── Deliverable quality check ─────────────────────────────────────────────────
async function processDeliverable(job: Job) {
  const { deliverableId } = job.data;
  console.log(`[AI Worker] Checking deliverable ${deliverableId}`);

  const deliverable = await db.jobDeliverable.findUnique({
    where: { id: deliverableId },
    include: { job: { include: { campaign: true } } },
  });

  if (!deliverable) {
    console.error(`[AI Worker] Deliverable ${deliverableId} not found`);
    return;
  }

  try {
    const result = await checkDeliverableQuality({
      deliverableId,
      videoUrl: deliverable.cloudinaryUrl,
      campaignBrief: deliverable.job.campaign.description,
    });

    await db.jobDeliverable.update({
      where: { id: deliverableId },
      data: {
        aiScore: result.overall,
        aiScoreBreakdown: result.breakdown as any,
        aiQualified: result.overall >= 60,
      },
    });

    // Update job status to DELIVERED (AI check complete)
    await db.job.update({
      where: { id: deliverable.jobId },
      data: {
        status: "DELIVERED",
        autoReleaseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`[AI Worker] Deliverable ${deliverableId} scored ${result.overall}`);
  } catch (err) {
    console.error(`[AI Worker] Error checking deliverable ${deliverableId}:`, err);
    throw err;
  }
}

// ── Start worker ──────────────────────────────────────────────────────────────
const worker = new Worker(
  "ai-queue",
  async (job: Job) => {
    if (job.name === "check-proposal") {
      await processProposal(job);
    } else if (job.name === "check-deliverable") {
      await processDeliverable(job);
    } else {
      console.warn(`[AI Worker] Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

worker.on("completed", (job) => {
  console.log(`[AI Worker] Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[AI Worker] Job ${job?.id} (${job?.name}) failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[AI Worker] Worker error:", err);
});

console.log("[AI Worker] Started — listening on ai-queue");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[AI Worker] SIGTERM received, closing worker...");
  await worker.close();
  await db.$disconnect();
  process.exit(0);
});
