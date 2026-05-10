import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateTier, TIER_RANK, TierName } from "@/lib/payouts/tier-rules";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const army = await db.creatorProfile.findMany({
    where: { isGravyArmy: true },
    select: { id: true, tier: true, userId: true, displayName: true },
  });

  let promoted = 0;
  let demoted = 0;
  const changes: Array<{
    creatorId: string;
    displayName: string;
    fromTier: TierName;
    toTier: TierName;
    conversions: number;
  }> = [];

  for (const c of army) {
    const conversions = await db.conversion.count({
      where: {
        trackingLink: { creatorId: c.userId },
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    const newTier = calculateTier(conversions);
    if (newTier !== c.tier) {
      await db.$transaction([
        db.creatorProfile.update({
          where: { id: c.id },
          data: { tier: newTier, tierUpdatedAt: new Date() },
        }),
        db.creatorTierHistory.create({
          data: {
            creatorId: c.id,
            fromTier: c.tier,
            toTier: newTier,
            reason: `Auto: ${conversions} conversions in last 30d`,
          },
        }),
      ]);

      if (TIER_RANK[newTier] > TIER_RANK[c.tier as TierName]) {
        promoted++;
      } else {
        demoted++;
      }

      changes.push({
        creatorId: c.id,
        displayName: c.displayName,
        fromTier: c.tier as TierName,
        toTier: newTier,
        conversions,
      });
    }
  }

  return NextResponse.json({
    recalculated: army.length,
    promoted,
    demoted,
    changes,
  });
}
