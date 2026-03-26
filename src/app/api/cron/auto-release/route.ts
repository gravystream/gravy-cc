import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/cron/auto-release
 * Called by a cron job (e.g. PM2 cron, or cURL from crontab) every hour.
 * Automatically approves delivered jobs where autoReleaseAt has passed.
 *
 * Secure with CRON_SECRET env var:
 *   Add to .env: CRON_SECRET=<random-string>
 *   Call via: curl -H "Authorization: Bearer <CRON_SECRET>" https://novaclio.io/api/cron/auto-release
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all delivered jobs where autoReleaseAt has passed
  const overdueJobs = await db.job.findMany({
    where: {
      status: "DELIVERED",
      autoReleaseAt: { lte: now },
    },
  include: {
    proposal: {
      include: {
        campaign: { select: { title: true, brand: { select: { userId: true } } } },
      },
    },
  },
  });

  if (overdueJobs.length === 0) {
    return NextResponse.json({ released: 0, message: "No overdue jobs" });
  }

  let releasedCount = 0;
  const errors: string[] = [];

  for (const job of overdueJobs) {
    try {
      // Fetch escrow separately since Job has escrowId but no relation
    const escrow = job.escrowId ? await db.escrow.findUnique({ where: { id: job.escrowId } }) : null;

    if (!escrow || escrow.status !== "FUNDED") {
        continue; // skip if escrow not funded
      }

      const campaign = job.proposal?.campaign;
      const creatorPayout = escrow.amountKobo - escrow.platformFeeKobo;

      await db.$transaction(async (tx) => {
        // Release escrow
        await tx.escrow.update({
          where: { id: escrow!.id },
          data: { status: "RELEASED", releasedAt: now, releasedToId: job.creatorId },
        });

        // Credit creator wallet
        const wallet = await tx.wallet.upsert({
          where: { creatorId: job.creatorId },
          create: { creatorId: job.creatorId, balanceKobo: creatorPayout, pendingKobo: 0 },
          update: {
            balanceKobo: { increment: creatorPayout },
            pendingKobo: { decrement: creatorPayout },
          },
        });

        // Record transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amountKobo: creatorPayout,
            type: "CREDIT",
            description: `Auto-release: payment for job #${job.id.slice(-8)}`,
            jobId: job.id,
          },
        });

        // Update job status
        await tx.job.update({
          where: { id: job.id },
          data: { status: "PAID", autoReleaseAt: null },
        });

        // Notify creator
        await tx.notification.create({
          data: {
            userId: job.creatorId,
            type: "PAYMENT_RELEASED",
            title: "💰 Payment auto-released",
            body: `₦${(creatorPayout / 100).toLocaleString()} for "${campaign?.title ?? "Campaign"}" was automatically released after 7 days.`,
            actionUrl: `/creator/wallet`,
          },
        });

        // Notify brand
        await tx.notification.create({
          data: {
            userId: campaign?.brand?.userId ?? "",
            type: "GENERAL",
            title: "Payment auto-released",
            body: `Payment for "${campaign?.title ?? "Campaign"}" was auto-released to the creator after 7 days of no response.`,
            actionUrl: `/brand/jobs/${job.id}`,
          },
        });
      });

      releasedCount++;
    } catch (err: any) {
      errors.push(`Job ${job.id}: ${err.message}`);
    }
  }

  return NextResponse.json({
    released: releasedCount,
    errors: errors.length > 0 ? errors : undefined,
    processedAt: now.toISOString(),
  });
}
