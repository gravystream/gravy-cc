import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await db.job.findMany({
    where: { creatorId: session.user.id },
    include: {
      campaign: { select: { title: true } },
      escrow: { select: { amountKobo: true, platformFeeKobo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ jobs });
}
