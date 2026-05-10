import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.on("error", (err) => console.error("Redis link-cache error:", err));
  }
  return redis;
}

const CACHE_PREFIX = "tracking:link:";
const CACHE_TTL = 86400; // 24 hours

interface CachedLink {
  id: string;
  destinationUrl: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  maxClicks?: number | null;
  totalClicks: number;
}

export async function getCachedLink(shortCode: string): Promise<CachedLink | null> {
  try {
    const r = getRedis();
    const data = await r.get(CACHE_PREFIX + shortCode);
    if (data) return JSON.parse(data);
    return null;
  } catch (err) {
    console.error("Redis getCachedLink error:", err);
    return null;
  }
}

export async function setCachedLink(shortCode: string, link: CachedLink): Promise<void> {
  try {
    const r = getRedis();
    await r.set(CACHE_PREFIX + shortCode, JSON.stringify(link), "EX", CACHE_TTL);
  } catch (err) {
    console.error("Redis setCachedLink error:", err);
  }
}

export async function invalidateCachedLink(shortCode: string): Promise<void> {
  try {
    const r = getRedis();
    await r.del(CACHE_PREFIX + shortCode);
  } catch (err) {
    console.error("Redis invalidateCachedLink error:", err);
  }
}

export async function incrementClickCounter(trackingLinkId: string): Promise<number> {
  try {
    const r = getRedis();
    const key = "tracking:clicks:" + trackingLinkId;
    const count = await r.incr(key);
    await r.expire(key, CACHE_TTL);
    return count;
  } catch (err) {
    console.error("Redis incrementClickCounter error:", err);
    return 0;
  }
}
