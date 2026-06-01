import { db } from "@/lib/db";

export interface AudienceCountry {
  country: string;
  countryCode: string | null;
  flag: string;
  count: number;
}

export interface AudienceBucket {
  label: string;
  count: number;
}

export interface AudienceProfile {
  totalClicks: number;
  uniqueVisitors: number;
  countries: AudienceCountry[];
  devices: AudienceBucket[];
  browsers: AudienceBucket[];
  hourOfDay: number[];
  windowDays: number;
}

/**
 * Given a CreatorProfile.id (or username), aggregate LinkClick data
 * across all tracking links the creator owns within `windowDays`.
 *
 * Returns null if the creator can't be resolved.
 *
 * Note: TrackingLink.creatorId is User.id, not CreatorProfile.id, so
 * we resolve the userId first.
 */
export async function getCreatorAudienceProfile(
  idOrUsername: string,
  windowDays: number = 30
): Promise<AudienceProfile | null> {
  const profile = await db.creatorProfile.findFirst({
    where: {
      OR: [{ id: idOrUsername }, { username: idOrUsername }],
    },
    select: { userId: true },
  });
  if (!profile) return null;

  const links = await db.trackingLink.findMany({
    where: { creatorId: profile.userId },
    select: { id: true },
  });
  const linkIds = links.map((l) => l.id);

  if (linkIds.length === 0) {
    return {
      totalClicks: 0,
      uniqueVisitors: 0,
      countries: [],
      devices: [],
      browsers: [],
      hourOfDay: new Array(24).fill(0),
      windowDays,
    };
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - windowDays);

  const clicks = await db.linkClick.findMany({
    where: {
      trackingLinkId: { in: linkIds },
      timestamp: { gte: since },
    },
    select: {
      country: true,
      countryCode: true,
      device: true,
      deviceType: true,
      browser: true,
      isUnique: true,
      timestamp: true,
    },
  });

  const countryMap = new Map<string, { code: string | null; count: number }>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const hourOfDay = new Array(24).fill(0);
  let uniqueVisitors = 0;

  for (const c of clicks) {
    const country = c.country ?? "Unknown";
    const existing = countryMap.get(country);
    if (existing) {
      existing.count++;
    } else {
      countryMap.set(country, { code: c.countryCode ?? null, count: 1 });
    }

    const device = c.deviceType || c.device || "Unknown";
    deviceMap.set(device, (deviceMap.get(device) ?? 0) + 1);

    const browser = c.browser ?? "Unknown";
    browserMap.set(browser, (browserMap.get(browser) ?? 0) + 1);

    const hour = c.timestamp.getUTCHours();
    hourOfDay[hour]++;

    if (c.isUnique) uniqueVisitors++;
  }

  const countries: AudienceCountry[] = Array.from(countryMap.entries())
    .map(([country, v]) => ({
      country,
      countryCode: v.code,
      flag: flagEmoji(v.code),
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const devices: AudienceBucket[] = Array.from(deviceMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const browsers: AudienceBucket[] = Array.from(browserMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalClicks: clicks.length,
    uniqueVisitors,
    countries,
    devices,
    browsers,
    hourOfDay,
    windowDays,
  };
}

function flagEmoji(code: string | null): string {
  if (!code || code.length !== 2) return "🏳️";
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
