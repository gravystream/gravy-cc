// GeoIP lookup utility
// Uses ip-api.com free tier (45 req/min) with Redis caching

import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.on("error", (err) => console.error("Redis geoip error:", err));
  }
  return redis;
}

const GEO_CACHE_PREFIX = "geoip:";
const GEO_CACHE_TTL = 86400 * 7; // 7 days

export interface GeoResult {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  lat: number | null;
  lon: number | null;
}

const EMPTY_GEO: GeoResult = {
  country: null,
  countryCode: null,
  city: null,
  region: null,
  lat: null,
  lon: null,
};

export async function lookupGeoIP(ip: string): Promise<GeoResult> {
  // Skip private/local IPs
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip === "::1") {
    return EMPTY_GEO;
  }

  try {
    const r = getRedis();

    // Check cache
    const cached = await r.get(`${GEO_CACHE_PREFIX}${ip}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query ip-api.com (free, no key needed, 45 req/min)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!response.ok) {
      return EMPTY_GEO;
    }

    const data = await response.json();

    if (data.status !== "success") {
      return EMPTY_GEO;
    }

    const result: GeoResult = {
      country: data.country || null,
      countryCode: data.countryCode || null,
      city: data.city || null,
      region: data.regionName || null,
      lat: data.lat || null,
      lon: data.lon || null,
    };

    // Cache result
    await r.set(`${GEO_CACHE_PREFIX}${ip}`, JSON.stringify(result), "EX", GEO_CACHE_TTL);

    return result;
  } catch (error) {
    console.error("GeoIP lookup failed:", error);
    return EMPTY_GEO;
  }
}
