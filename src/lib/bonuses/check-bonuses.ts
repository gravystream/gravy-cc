import { db } from "@/lib/db";

/**
 * Inspect any pending PerformanceBonus rows for a tracking link's
 * (campaign × creator) and stamp earnedAt on those that have hit
 * their threshold. Safe to call repeatedly; only flips earnedAt
 * once.
 *
 * Called from:
 *   - click-worker.ts after counter update (CLICKS / UNIQUE_CLICKS)
 *   - webhooks/conversions/route.ts after conversion (CONVERSIONS / REVENUE_KOBO)
 *
 * Note: TrackingLink.creatorId is User.id (not CreatorProfile.id).
 * We resolve the CreatorProfile via userId before matching bonuses.
 */
export async function checkAndFlagBonusesForLink(trackingLinkId: string) {
  const link = await db.trackingLink.findUnique({
    where: { id: trackingLinkId },
    select: {
      id: true,
      campaignId: true,
      creatorId: true,
      totalClicks: true,
      uniqueClicks: true,
    },
  });
  if (!link) return [];

  const creatorProfile = await db.creatorProfile.findUnique({
    where: { userId: link.creatorId },
    select: { id: true },
  });
  if (!creatorProfile) return [];

  const pending = await db.performanceBonus.findMany({
    where: {
      campaignId: link.campaignId,
      creatorId: creatorProfile.id,
      earnedAt: null,
    },
  });
  if (pending.length === 0) return [];

  // Compute metrics this creator has driven for this campaign.
  // Bonuses span all of a creator's links in the campaign, not just one.
  const creatorLinks = await db.trackingLink.findMany({
    where: { campaignId: link.campaignId, creatorId: link.creatorId },
    select: { id: true, totalClicks: true, uniqueClicks: true },
  });
  const linkIds = creatorLinks.map((l) => l.id);

  const totalClicks = creatorLinks.reduce((s, l) => s + l.totalClicks, 0);
  const uniqueClicks = creatorLinks.reduce((s, l) => s + l.uniqueClicks, 0);

  let conversionCount = 0;
  let revenueSumKobo = 0;
  if (
    pending.some((b) =>
      ["CONVERSIONS", "REVENUE_KOBO"].includes(b.thresholdType)
    )
  ) {
    const convs = await db.conversion.findMany({
      where: { trackingLinkId: { in: linkIds } },
      select: { value: true },
    });
    conversionCount = convs.length;
    revenueSumKobo = convs.reduce(
      (s, c) => s + (c.value ? Number(c.value) : 0),
      0
    );
  }

  const earned: typeof pending = [];
  for (const bonus of pending) {
    let metric = 0;
    switch (bonus.thresholdType) {
      case "CLICKS":
        metric = totalClicks;
        break;
      case "UNIQUE_CLICKS":
        metric = uniqueClicks;
        break;
      case "CONVERSIONS":
        metric = conversionCount;
        break;
      case "REVENUE_KOBO":
        metric = revenueSumKobo;
        break;
    }
    if (metric >= bonus.threshold) {
      await db.performanceBonus.update({
        where: { id: bonus.id },
        data: { earnedAt: new Date() },
      });
      earned.push(bonus);
    }
  }
  return earned;
}
