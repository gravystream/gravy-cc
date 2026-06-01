import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — earned-but-unpaid bonuses across all campaigns for this brand
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brandProfile) {
    return NextResponse.json(
      { error: "Brand profile not found" },
      { status: 404 }
    );
  }

  const bonuses = await db.performanceBonus.findMany({
    where: {
      campaign: { brandId: brandProfile.id },
      earnedAt: { not: null },
      paidAt: null,
    },
    orderBy: { earnedAt: "asc" },
    include: {
      campaign: { select: { id: true, title: true } },
      creator: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          tier: true,
          isGravyArmy: true,
        },
      },
    },
  });

  const totals = {
    count: bonuses.length,
    totalOwedKobo: bonuses.reduce((s, b) => s + b.bonusAmountKobo, 0),
  };

  return NextResponse.json({ bonuses, totals });
}

// POST — mark a bonus paid manually
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brandProfile = await db.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brandProfile) {
    return NextResponse.json(
      { error: "Brand profile not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { bonusId, notes } = body as { bonusId: string; notes?: string };
    if (!bonusId) {
      return NextResponse.json({ error: "bonusId required" }, { status: 400 });
    }

    // Authorize: bonus must belong to a campaign this brand owns
    const bonus = await db.performanceBonus.findFirst({
      where: {
        id: bonusId,
        campaign: { brandId: brandProfile.id },
      },
      select: { id: true, paidAt: true, earnedAt: true },
    });
    if (!bonus) {
      return NextResponse.json({ error: "Bonus not found" }, { status: 404 });
    }
    if (bonus.paidAt) {
      return NextResponse.json(
        { error: "Bonus already marked paid" },
        { status: 400 }
      );
    }
    if (!bonus.earnedAt) {
      return NextResponse.json(
        { error: "Bonus not yet earned" },
        { status: 400 }
      );
    }

    const updated = await db.performanceBonus.update({
      where: { id: bonusId },
      data: {
        paidAt: new Date(),
        paidManually: true,
        ...(notes ? { notes } : {}),
      },
    });

    return NextResponse.json({ bonus: updated });
  } catch (error: any) {
    console.error("Mark paid error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to mark paid" },
      { status: 500 }
    );
  }
}
