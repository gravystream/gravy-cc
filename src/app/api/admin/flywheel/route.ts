import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const metrics = await db.flywheelMetric.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: "asc" },
  });

  const today = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const totals = metrics.reduce(
    (acc, m) => ({
      signups: acc.signups + m.signups,
      activations: acc.activations + m.activations,
      transactions: acc.transactions + m.transactions,
      referrals: acc.referrals + m.referrals,
    }),
    { signups: 0, activations: 0, transactions: 0, referrals: 0 }
  );

  return NextResponse.json({ today, metrics, totals });
}
