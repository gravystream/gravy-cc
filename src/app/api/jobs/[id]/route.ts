import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = await db.job.findUnique({
    where: { id: id },
    include: {
      campaign: { select: { title: true, userId: true, budget: true } },
      creator: { select: { id: true, name: true, email: true } },
      deliverables: { orderBy: { createdAt: "desc" } },
      escrow: true,
      proposal: { select: { coverLetter: true, proposedBudget: true } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Only brand owner or assigned creator can view
  if (job.campaign.userId !== session.user.id && job.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ job });
}
