import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/direct-hire/[id]/accept — creator accepts a direct hire offer
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offer = await db.directHireOffer.findUnique({
    where: { id: id },
    include: { campaign: true },
  });

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }
  if (offer.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (offer.status !== "PENDING") {
    return NextResponse.json({ error: "Offer is no longer pending" }, { status: 400 });
  }
  if (offer.expiresAt < new Date()) {
    return NextResponse.json({ error: "Offer has expired" }, { status: 400 });
  }

  const result = await db.$transaction(async (tx) => {
    const updatedOffer = await tx.directHireOffer.update({
      where: { id: id },
      data: { status: "ACCEPTED" },
    });

    // Create a proposal automatically
    const proposal = await tx.proposal.create({
      data: {
        campaignId: offer.campaignId,
        creatorId: offer.creatorId,
        pitchText: "Direct hire accepted",
        rateKobo: offer.offerRateKobo,
        estimatedDays: 7,
        status: "SELECTED",
      },
    });

    // Create the job
    const job = await tx.job.create({
      data: {
        campaignId: offer.campaignId,
        creatorId: offer.creatorId,
        proposalId: proposal.id,
        agreedRateKobo: offer.offerRateKobo,
        deadline: offer.campaign.deadline ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "PENDING_PAYMENT",
        revisionsAllowed: 2,
        revisionsLeft: 2,
      },
    });

    // Create pending escrow
    const platformFeeKobo = Math.round(offer.offerRateKobo * 0.12);
    await tx.escrow.create({
      data: {
        jobId: job.id,
        amountKobo: offer.offerRateKobo,
        platformFeeKobo,
        status: "PENDING",
      },
    });

    // Notify brand
    await tx.notification.create({
      data: {
        userId: offer.brandId,
        type: "DIRECT_HIRE_ACCEPTED",
        title: "✅ Direct hire offer accepted",
        body: `Creator accepted your offer for "${offer.campaign.title}". Complete payment to start.`,
        actionUrl: `/brand/jobs/${job.id}`,
      },
    });

    return { offer: updatedOffer, job };
  });

  return NextResponse.json(result);
}
