import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

const DEFAULT_RETENTION_MONTHS = parseFloat(
  process.env.GRAVY_AVG_RETENTION_MONTHS || "6"
);

export async function GET(req: Request) {
  const session = await auth();
  if (
    !session?.user ||
    !ADMIN_ROLES.includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.max(
    7,
    Math.min(365, parseInt(searchParams.get("days") || "90", 10))
  );

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  // Spend = sum of campaign budgets created in the window. Proxy for brand
  // outlay; ignores escrow status.
  const campaignsInWindow = await db.campaign.findMany({
    where: { createdAt: { gte: since } },
    select: { budgetKobo: true },
  });
  const spendKobo = campaignsInWindow.reduce((s, c) => s + c.budgetKobo, 0);

  const signups = await db.user.count({
    where: { createdAt: { gte: since } },
  });

  // Revenue = sum of Conversion.value in the window (kobo).
  const conversionsInWindow = await db.conversion.findMany({
    where: { timestamp: { gte: since } },
    select: { value: true, trackingLink: { select: { creatorId: true } } },
  });
  const revenueKobo = conversionsInWindow.reduce(
    (s, c) => s + (c.value ? Number(c.value) : 0),
    0
  );

  // Active users = distinct creators with at least one conversion in window.
  // Closest available proxy without a session/login table.
  const activeUserSet = new Set<string>();
  for (const c of conversionsInWindow) {
    if (c.trackingLink?.creatorId) activeUserSet.add(c.trackingLink.creatorId);
  }
  const activeUsers = activeUserSet.size;

  const referrals = 0; // User.referredById not in schema yet
  const viralCoefficient = signups > 0 ? referrals / signups : 0;

  const cacKobo = signups > 0 ? Math.round(spendKobo / signups) : 0;
  const arpuKobo = activeUsers > 0 ? Math.round(revenueKobo / activeUsers) : 0;
  const ltvKobo = Math.round(arpuKobo * DEFAULT_RETENTION_MONTHS);

  // Daily series for sparklines
  const signupRows = await db.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const signupSeries = bucketDailyDates(
    signupRows.map((r) => r.createdAt),
    since,
    days
  );

  const convTimestamps = await db.conversion.findMany({
    where: { timestamp: { gte: since } },
    select: { timestamp: true, value: true },
  });
  const revenueDaily = bucketDailyTimestamped(
    convTimestamps.map((c) => ({
      timestamp: c.timestamp,
      value: c.value ? Number(c.value) : 0,
    })),
    since,
    days
  );

  return NextResponse.json({
    windowDays: days,
    metrics: {
      cacKobo,
      arpuKobo,
      ltvKobo,
      retentionMonths: DEFAULT_RETENTION_MONTHS,
      viralCoefficient,
    },
    raw: {
      spendKobo,
      revenueKobo,
      signups,
      activeUsers,
      referrals,
    },
    series: {
      signups: signupSeries,
      revenueKobo: revenueDaily,
    },
    sinceDate: since.toISOString(),
  });
}

function bucketDailyDates(items: Date[], since: Date, days: number): number[] {
  const buckets = new Array(days).fill(0);
  for (const date of items) {
    const offset = Math.floor(
      (date.getTime() - since.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (offset >= 0 && offset < days) {
      buckets[offset]++;
    }
  }
  return buckets;
}

function bucketDailyTimestamped(
  items: Array<{ timestamp: Date; value: number }>,
  since: Date,
  days: number
): number[] {
  const buckets = new Array(days).fill(0);
  for (const item of items) {
    const offset = Math.floor(
      (item.timestamp.getTime() - since.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (offset >= 0 && offset < days) {
      buckets[offset] += item.value;
    }
  }
  return buckets;
}
