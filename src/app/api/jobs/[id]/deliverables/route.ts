import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, description, fileType } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const job = await db.job.findUnique({ where: { id: id } });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden - only the assigned creator can submit" }, { status: 403 });
  }

  if (!["IN_PROGRESS", "REVISION_REQUESTED"].includes(job.status)) {
    return NextResponse.json({ error: "Job is not in a deliverable state" }, { status: 400 });
  }

  const result = await db.$transaction(async (tx) => {
    const deliverable = await tx.jobDeliverable.create({
      data: {
        jobId: job.id,
        cloudinaryUrl: url,
        cloudinaryId: url, // MVP: use URL as ID
        fileType: fileType ?? "video",
        description: description ?? "",
      },
    });

    const updatedJob = await tx.job.update({
      where: { id: job.id },
      data: { status: "DELIVERED" },
    });

    return { deliverable, job: updatedJob };
  });

  return NextResponse.json(result, { status: 201 });
}
