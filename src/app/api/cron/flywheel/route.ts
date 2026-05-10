import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Daily flywheel snapshot. Schedule on the VPS:
 *   0 3 * * *  curl -X POST -H "X-Cron-Secret: $CRON_SECRET" \
 *     https://novaclio.io/api/cron/flywheel
 *
 * Activations = users who created a CreatorProfile or BrandProfile that day.
 * Referrals = 0 for now (User.referredById doesn't exist in the schema).
 */
export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const [signups, creatorActivations, brandActivations, transactions] =
    await Promise.all([
      db.user.count({
        where: { createdAt: { gte: startOfToday, lt: endOfToday } },
      }),
      db.creatorProfile.count({
        where: { createdAt: { gte: startOfToday, lt: endOfToday } },
      }),
      db.brandProfile.count({
        where: { createdAt: { gte: startOfToday, lt: endOfToday } },
      }),
      db.conversion.count({
        where: { timestamp: { gte: startOfToday, lt: endOfToday } },
      }),
    ]);

  const activations = creatorActivations + brandActivations;
  const referrals = 0;

  const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);

  const metric = await db.flywheelMetric.upsert({
    where: { date: startOfToday },
    create: {
      date: startOfToday,
      signups,
      activations,
      transactions,
      referrals,
      signupToActivation: ratio(activations, signups),
      activationToTransaction: ratio(transactions, activations),
      transactionToReferral: ratio(referrals, transactions),
      referralToSignup: ratio(signups, referrals),
    },
    update: {
      signups,
      activations,
      transactions,
      referrals,
      signupToActivation: ratio(activations, signups),
      activationToTransaction: ratio(transactions, activations),
      transactionToReferral: ratio(referrals, transactions),
      referralToSignup: ratio(signups, referrals),
    },
  });

  return NextResponse.json({ metric });
}
