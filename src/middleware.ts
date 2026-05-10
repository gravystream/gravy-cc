import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return; // Only clean every 60s
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(ip: string, path: string, max: number, windowMs: number): NextResponse | null {
  cleanup();
  const key = ip + ":" + path;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (entry.count >= max) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((entry.resetTime - now) / 1000)),
        },
      }
    );
  }

  entry.count++;
  return null;
}

// Rate limit configuration per route pattern
const RATE_LIMITS: { pattern: RegExp; max: number; windowMs: number }[] = [
  // Auth endpoints - strict limits
  { pattern: /^\/api\/auth/, max: 15, windowMs: 15 * 60 * 1000 },
  // Registration/onboarding
  { pattern: /^\/api\/onboarding/, max: 10, windowMs: 60 * 1000 },
  // File uploads
  { pattern: /^\/api\/upload/, max: 10, windowMs: 60 * 1000 },
  // Public browsing endpoints
  { pattern: /^\/api\/creators/, max: 60, windowMs: 60 * 1000 },
  { pattern: /^\/api\/briefs/, max: 60, windowMs: 60 * 1000 },
  // Message sending (prevent spam)
  { pattern: /^\/api\/conversations\/.*\/messages/, max: 30, windowMs: 60 * 1000 },
  // Contract operations
  { pattern: /^\/api\/contracts/, max: 30, windowMs: 60 * 1000 },
  // Default API rate limit
  { pattern: /^\/api\//, max: 60, windowMs: 60 * 1000 },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip internal/health endpoints
  if (pathname === "/api/health" || pathname === "/api/deploy-temp") {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Find matching rate limit config
  for (const { pattern, max, windowMs } of RATE_LIMITS) {
    if (pattern.test(pathname)) {
      const blocked = checkRateLimit(ip, pathname, max, windowMs);
      if (blocked) return blocked;
      break;
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
