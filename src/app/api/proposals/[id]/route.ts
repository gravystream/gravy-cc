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

  const { action } = await req.json(); // "accept" | "reject"

  const proposal = await db.proposal.findUnique({
    where: { id: id },
    include: { campaign: true },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Only the campaign owner (brand) can accept/reject
  if (proposal.campaign.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (proposal.status !== "PENDING") {
    return NextResponse.json({ error: "Proposal is no longer pending" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await db.proposal.update({
      where: { id: id },
      data: { status: "REJECTED" },
    });
    return NextResponse.json({ proposal: updated });
  }

  if (action === "accept") {
    // Find the creator user id
    const creatorProfile = await db.creatorProfile.findUnique({
      where: { id: proposal.creatorProfileId },
    });
    if (!creatorProfile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const amountKobo = Math.round((proposal.proposedBudget ?? proposal.campaign.budget) * 100);
    const platformFeeKobo = Math.round(amountKobo * 0.1);

    // Create Job + Escrow in a transaction
    const result = await db.$transaction(async (tx) => {
      // Mark proposal accepted
      const updatedProposal = await tx.proposal.update({
        where: { id: id },
        data: { status: "ACCEPTED" },
      });

      // Create escrow
      const escrow = await tx.escrow.create({
        data: {
          campaignId: proposal.campaignId,
          amountKobo,
          platformFeeKobo,
          feePercent: 10,
          status: "PENDING_DEPOSIT",
        },
      });

      // Create job
      const job = await tx.job.create({
        data: {
          campaignId: proposal.campaignId,
          creatorId: creatorProfile.userId,
          proposalId: proposal.id,
          escrowId: escrow.id,
          status: "AWAITING_PAYMENT",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
        },
      });

      return { job, escrow, updatedProposal };
    });

    // Initialize Paystack payment
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: amountKobo,
        currency: "NGN",
        metadata: {
          jobId: result.job.id,
          escrowId: result.escrow.id,
          campaignId: proposal.campaignId,
        },
        callback_url: `${process.env.NEXTAUTH_URL}/brand/jobs/${result.job.id}?paid=1`,
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: "Failed to initialize payment", detail: paystackData }, { status: 500 });
    }

    return NextResponse.json({
      job: result.job,
      paymentUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
