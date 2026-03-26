import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyProposalAccepted } from "@/lib/email-notifications";

// POST /api/proposals/[id]/select — brand selects a proposal, creates a Job
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const proposal = await db.proposal.findUnique({
    where: { id: id },
    include: { campaign: true },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }
  if (proposal.campaign.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden — only the campaign owner can select" }, { status: 403 });
  }
  if (!["QUALIFIED", "SHORTLISTED"].includes(proposal.status)) {
    return NextResponse.json({ error: "Can only select QUALIFIED or SHORTLISTED proposals" }, { status: 400 });
  }

  // Check if a job already exists for this proposal
  const existingJob = await db.job.findUnique({ where: { proposalId: proposal.id } });
  if (existingJob) {
    return NextResponse.json({ error: "Job already created for this proposal" }, { status: 400 });
  }

  const { agreedRateKobo, daysToComplete } = await req.json();
  const rate = agreedRateKobo ?? proposal.rateKobo;
  const days = daysToComplete ?? proposal.estimatedDays ?? 7;

  const result = await db.$transaction(async (tx) => {
    // Update proposal to SELECTED
    const updatedProposal = await tx.proposal.update({
      where: { id: proposal.id },
      data: { status: "SELECTED" },
    });

    // Reject all other proposals for this campaign
    await tx.proposal.updateMany({
      where: {
        campaignId: proposal.campaignId,
        id: { not: proposal.id },
        status: { notIn: ["REJECTED"] },
      },
      data: { status: "REJECTED" },
    });

    // Create the job
    const job = await tx.job.create({
      data: {
        campaignId: proposal.campaignId,
        creatorId: proposal.creatorId,
        proposalId: proposal.id,
        agreedRateKobo: rate,
        deadline: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        status: "PENDING_PAYMENT",
        revisionsAllowed: 2,
        revisionsLeft: 2,
      },
    });

    // Create pending escrow
    const platformFeeKobo = Math.round(rate * 0.12);
    await tx.escrow.create({
      data: {
        jobId: job.id,
        amountKobo: rate,
        platformFeeKobo,
        status: "PENDING",
      },
    });

    // Update campaign status
    await tx.campaign.update({
      where: { id: proposal.campaignId },
      data: { status: "IN_PROGRESS" },
    });

    // Notify creator
    await tx.notification.create({
      data: {
        userId: proposal.creatorId,
        type: "PROPOSAL_SELECTED",
        title: "🎉 Your proposal was selected!",
        body: `Your proposal for "${proposal.campaign.title}" was selected. Complete payment to start the job.`,
        actionUrl: `/creator/jobs/${job.id}`,
      },
    });

    return { job, proposal: updatedProposal };
  });

  // Email notify the creator that their proposal was accepted
  try {
    const creatorUser = await db.user.findUnique({
      where: { id: proposal.creatorId },
      select: { email: true, name: true },
    });
    if (creatorUser?.email) {
      await notifyProposalAccepted(
        creatorUser.email,
        creatorUser.name || "Creator",
        proposal.campaign?.title || "Campaign",
        result.job?.id || ""
      );
    }
  } catch (emailErr) { console.error("Email notification failed:", emailErr); }

  return NextResponse.json(result, { status: 201 });
}
