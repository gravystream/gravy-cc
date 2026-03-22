import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/jobs/[id]/request-revision — brand requests a revision on a delivered job
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = await db.job.findUnique({
    where: { id: id },
    include: { campaign: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.campaign.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden — only the brand can request revision" }, { status: 403 });
  }
  if (job.status !== "DELIVERED") {
    return NextResponse.json({ error: "Job must be in DELIVERED state" }, { status: 400 });
  }
  if (job.revisionsLeft <= 0) {
    return NextResponse.json({ error: "No revisions remaining" }, { status: 400 });
  }

  const { feedback } = await req.json();

  const result = await db.$transaction(async (tx) => {
    const updatedJob = await tx.job.update({
      where: { id: id },
      data: {
        status: "REVISION_REQUESTED",
        revisionsLeft: { decrement: 1 },
        autoReleaseAt: null, // clear auto-release timer
      },
    });

    // Notify creator
    await tx.notification.create({
      data: {
        userId: job.creatorId,
        type: "REVISION_REQUESTED",
        title: "Revision requested",
        body: feedback
          ? `Brand requested a revision: "${feedback.substring(0, 100)}"`
          : `Brand requested a revision for "${job.campaign.title}"`,
        actionUrl: `/creator/jobs/${job.id}`,
      },
    });

    return { job: updatedJob };
  });

  return NextResponse.json(result);
}
