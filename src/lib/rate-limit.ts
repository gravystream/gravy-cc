import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs?: number; // Time window in ms (default: 60s)
  max?: number;      // Max requests per window (default: 30)
}

export function rateLimit(options: RateLimitOptions = {}) {
  const { windowMs = 60 * 1000, max = 30 } = options;

  return function checkRateLimit(req: NextRequest): NextResponse | null {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const key = ip + ":" + req.nextUrl.pathname;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return null; // Allow
    }

    if (entry.count >= max) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((entry.resetTime - now) / 1000)),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(entry.resetTime),
          },
        }
      );
    }

    entry.count++;
    return null; // Allow
  };
}

// Pre-configured limiters
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }); // 10 per 15min
export const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });        // 60 per min
export const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });     // 10 per min
