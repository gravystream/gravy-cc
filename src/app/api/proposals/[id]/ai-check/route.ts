import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkProposalQuality } from "@/lib/ai";

// POST /api/proposals/[id]/ai-check
// Triggered by the BullMQ worker (or manually for dev)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // In production this would be called by an internal worker with a secret header
  const workerSecret = req.headers.get("x-worker-secret");
  const isWorker = workerSecret === process.env.WORKER_SECRET;

  // Allow admins to trigger manually
  if (!isWorker) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const proposal = await db.proposal.findUnique({
    where: { id: params.id },
    include: {
      campaign: { select: { description: true, requirements: true, deliverables: true, niche: true } },
      creator: { select: { niches: true } },
    },
  });

  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (proposal.aiCheckedAt) return NextResponse.json({ message: "Already checked" });

  // Mark as under review
  await db.proposal.update({
    where: { id: params.id },
    data: { status: "UNDER_AI_REVIEW" },
  });

  try {
    const result = await checkProposalQuality({
      pitchVideoUrl: proposal.pitchCloudinaryUrl ?? undefined,
      coverLetter: proposal.coverLetter ?? undefined,
      campaignBrief: `${proposal.campaign.description}\n\nRequirements: ${proposal.campaign.requirements}`,
      creatorNiches: proposal.creator.niches,
    });

    await db.proposal.update({
      where: { id: params.id },
      data: {
        aiScore: result.overallScore,
        aiVideoScore: result.videoScore,
        aiAudioScore: result.audioScore,
        aiRelevanceScore: result.relevanceScore,
        aiFeedback: result.feedback,
        aiCheckedAt: new Date(),
        status: result.qualified ? "QUALIFIED" : "NOT_QUALIFIED",
      },
    });

    // Update campaign's qualified count
    if (result.qualified) {
      await db.campaign.update({
        where: { id: proposal.campaignId },
        data: { qualifiedCount: { increment: 1 } },
      });
    }

    // Notify creator
    await db.notification.create({
      data: {
        userId: proposal.creator.userId,
        type: result.qualified ? "PROPOSAL_QUALIFIED" : "PROPOSAL_REJECTED",
        title: result.qualified ? "Proposal Qualified!" : "Proposal Not Qualified",
        message: result.qualified
          ? `Your proposal scored ${result.overallScore}/100 and has been qualified. The brand will review it shortly.`
          : `Your proposal scored ${result.overallScore}/100. ${result.feedback}`,
        link: `/creator/proposals`,
      },
    });

    return NextResponse.json({ result });
  } catch (err) {
    console.error("[AI_CHECK_PROPOSAL]", err);
    // Revert status on error
    await db.proposal.update({
      where: { id: params.id },
      data: { status: "SUBMITTED" },
    });
    return NextResponse.json({ error: "AI check failed" }, { status: 500 });
  }
}
