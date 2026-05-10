import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfIsoWeek } from "@/lib/payouts/tier-rules";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    !ADMIN_ROLES.includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const snapshots = await db.gravyKPISnapshot.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: "asc" },
  });

  const today = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  // Top 10 Gravy creators this week by conversions
  const weekStart = startOfIsoWeek();
  const army = await db.creatorProfile.findMany({
    where: { isGravyArmy: true },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      tier: true,
      userId: true,
    },
  });

  const ranked = await Promise.all(
    army.map(async (c) => {
      const conversions = await db.conversion.count({
        where: {
          timestamp: { gte: weekStart },
          trackingLink: { creatorId: c.userId },
        },
      });
      return {
        creatorId: c.id,
        displayName: c.displayName,
        avatarUrl: c.avatarUrl,
        tier: c.tier,
        conversionsThisWeek: conversions,
      };
    })
  );

  ranked.sort((a, b) => b.conversionsThisWeek - a.conversionsThisWeek);
  const topPerformers = ranked.slice(0, 10);

  return NextResponse.json({
    today,
    snapshots,
    topPerformers,
    weekStart: weekStart.toISOString(),
  });
}
