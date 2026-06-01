import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Daily snapshot of Gravy Army KPIs. Schedule on the VPS:
//   0 2 * * *  curl -X POST -H "X-Cron-Secret: $CRON_SECRET" \
//     https://novaclio.io/api/cron/gravy-kpi-snapshot
//
// Idempotent on `date` (unique). Re-running for the same UTC day
// upserts the row.
export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const startOf24hWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const startOf7dWindow = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Gather Gravy Army user IDs (TrackingLink/Conversion/LinkClick all
  // tie back to User.id, not CreatorProfile.id).
  const army = await db.creatorProfile.findMany({
    where: { isGravyArmy: true },
    select: { userId: true },
  });
  const armyUserIds = army.map((c) => c.userId);

  if (armyUserIds.length === 0) {
    const empty = await db.gravyKPISnapshot.upsert({
      where: { date: startOfToday },
      create: { date: startOfToday },
      update: {},
    });
    return NextResponse.json({ snapshot: empty, note: "no army members" });
  }

  // Active = at least one click on a Gravy Army link in last 7 days
  const activeCreators = await db.linkClick.findMany({
    where: {
      timestamp: { gte: startOf7dWindow },
      trackingLink: { creatorId: { in: armyUserIds } },
    },
    distinct: ["trackingLinkId"],
    select: { trackingLink: { select: { creatorId: true } } },
  });
  const activeCreatorIds = new Set(
    activeCreators.map((c) => c.trackingLink.creatorId)
  );

  // 24h click + conversion + revenue stats
  const totalClicks = await db.linkClick.count({
    where: {
      timestamp: { gte: startOf24hWindow },
      trackingLink: { creatorId: { in: armyUserIds } },
    },
  });

  const conversions = await db.conversion.findMany({
    where: {
      timestamp: { gte: startOf24hWindow },
      trackingLink: { creatorId: { in: armyUserIds } },
    },
    select: { value: true },
  });
  const totalConversions = conversions.length;
  const totalRevenueKobo = conversions.reduce(
    (s, c) => s + (c.value ? Number(c.value) : 0),
    0
  );

  const snapshot = await db.gravyKPISnapshot.upsert({
    where: { date: startOfToday },
    create: {
      date: startOfToday,
      totalGravyCreators: armyUserIds.length,
      activeGravyCreators: activeCreatorIds.size,
      totalClicks,
      totalConversions,
      totalRevenueKobo: Math.round(totalRevenueKobo),
      newSignups: 0, // TODO: Phase 7 Gravy backend integration
    },
    update: {
      totalGravyCreators: armyUserIds.length,
      activeGravyCreators: activeCreatorIds.size,
      totalClicks,
      totalConversions,
      totalRevenueKobo: Math.round(totalRevenueKobo),
    },
  });

  return NextResponse.json({ snapshot });
}
