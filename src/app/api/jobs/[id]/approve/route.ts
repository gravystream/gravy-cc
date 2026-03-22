import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = await db.job.findUnique({
    where: { id: id },
    include: { campaign: true, escrow: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.campaign.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden - only the brand can approve" }, { status: 403 });
  }

  if (job.status !== "DELIVERED") {
    return NextResponse.json({ error: "Job must be in DELIVERED state to approve" }, { status: 400 });
  }

  if (!job.escrow || job.escrow.status !== "FUNDED") {
    return NextResponse.json({ error: "Escrow is not funded" }, { status: 400 });
  }

  const creatorPayout = job.escrow.amountKobo - job.escrow.platformFeeKobo;

  const result = await db.$transaction(async (tx) => {
    // Release escrow
    const escrow = await tx.escrow.update({
      where: { id: job.escrow!.id },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        releasedToId: job.creatorId,
      },
    });

    // Upsert creator wallet (credit balance)
    const wallet = await tx.wallet.upsert({
      where: { creatorId: job.creatorId },
      create: {
        creatorId: job.creatorId,
        balanceKobo: creatorPayout,
        pendingKobo: 0,
      },
      update: {
        balanceKobo: { increment: creatorPayout },
        pendingKobo: { decrement: creatorPayout }, // clear pending if it was there
      },
    });

    // Record wallet transaction
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amountKobo: creatorPayout,
        type: "CREDIT",
        description: `Payment released for job #${job.id.slice(-8)}`,
        jobId: job.id,
      },
    });

    // Update job to PAID
    const updatedJob = await tx.job.update({
      where: { id: job.id },
      data: { status: "PAID" },
    });

    return { job: updatedJob, wallet, transaction, escrow };
  });

  return NextResponse.json(result);
}
