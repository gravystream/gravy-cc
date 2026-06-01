import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calculateWeeklyPayoutKobo,
  getBaseRateKoboPerConversion,
  startOfIsoWeek,
  TierName,
} from "@/lib/payouts/tier-rules";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

export async function GET(req: Request) {
  const session = await auth();
  if (
    !session?.user ||
    !ADMIN_ROLES.includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get("weekStart");
  const weekStart = weekStartParam
    ? new Date(weekStartParam)
    : startOfIsoWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const baseRateKobo = getBaseRateKoboPerConversion();

  const army = await db.creatorProfile.findMany({
    where: { isGravyArmy: true },
    select: {
      id: true,
      displayName: true,
      tier: true,
      userId: true,
      user: { select: { email: true } },
    },
  });

  const rows = await Promise.all(
    army.map(async (c) => {
      const conversionsThisWeek = await db.conversion.count({
        where: {
          trackingLink: { creatorId: c.userId },
          timestamp: { gte: weekStart, lt: weekEnd },
        },
      });
      const owedKobo = calculateWeeklyPayoutKobo(
        conversionsThisWeek,
        c.tier as TierName,
        baseRateKobo
      );
      return {
        creatorId: c.id,
        displayName: c.displayName,
        email: c.user.email,
        tier: c.tier,
        conversionsThisWeek,
        owedKobo,
      };
    })
  );

  rows.sort((a, b) => b.owedKobo - a.owedKobo);

  return NextResponse.json({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    baseRateKobo,
    rows,
    totals: {
      creators: rows.length,
      conversions: rows.reduce((s, r) => s + r.conversionsThisWeek, 0),
      owedKobo: rows.reduce((s, r) => s + r.owedKobo, 0),
    },
  });
}
