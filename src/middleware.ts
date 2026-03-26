import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


function makeUrl(pathname, req) {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "novaclio.io";
  return new URL(pathname, `${proto}://${host}`);
}

export async function middleware(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  
  let token = null;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName, salt: cookieName });
  } catch (e) {}
  
  // Check if session cookie exists (any variant)
  const hasCookie = req.cookies.has(cookieName) || 
    req.cookies.has("authjs.session-token") || 
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("authjs.session-token.0") ||
    req.cookies.has("__Secure-authjs.session-token.0");
  
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const isLoggedIn = !!token || hasCookie;
  const needsOnboarding = token?.needsOnboarding === true;
  const isAdminDesk = hostname.includes("desk.novaclio.io");

  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isAdminLoginRoute = pathname.startsWith("/admin-login");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");

  // === DESK.NOVACLIO.IO ROUTING ===
  if (isAdminDesk) {
    if (isApiRoute || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
      return NextResponse.next();
    }
    if (pathname === "/") {
      return NextResponse.redirect(makeUrl("/admin-login", req));
    }
    if (isAdminLoginRoute) {
      // Only redirect away from login if we have a DECODED token (not just cookie)
      if (token) {
        const role = (token as any)?.role;
        const adminRoles = ["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"];
        if (adminRoles.includes(role)) {
          return NextResponse.redirect(makeUrl("/admin", req));
        }
      }
      // Otherwise serve the login page (even if cookie exists but token can't be decoded)
      return NextResponse.next();
    }
    if (isAdminRoute) {
      // For admin routes, allow through if ANY session indicator exists
      // The admin layout does its own server-side auth check
      if (!isLoggedIn) {
        return NextResponse.redirect(makeUrl("/admin-login", req));
      }
      return NextResponse.next();
    }
    return NextResponse.redirect(makeUrl("/admin-login", req));
  }

  // === NOVACLIO.IO ROUTING ===
  if (isApiRoute || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }
  if (pathname === "/" || pathname === "/how-it-works") {
    return NextResponse.next();
  }
  if (isAdminLoginRoute) {
    return NextResponse.redirect(makeUrl("/login", req));
  }
  if (isAuthRoute && isLoggedIn) {
    if (needsOnboarding) {
      return NextResponse.redirect(makeUrl("/onboarding", req));
    }
    return NextResponse.redirect(makeUrl("/dashboard", req));
  }
  if (isAuthRoute && !isLoggedIn) {
    return NextResponse.next();
  }
  if (isOnboardingRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(makeUrl("/login", req));
    }
    if (!needsOnboarding) {
      return NextResponse.redirect(makeUrl("/dashboard", req));
    }
    return NextResponse.next();
  }
  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(makeUrl("/login", req));
    }
    if (needsOnboarding) {
      return NextResponse.redirect(makeUrl("/onboarding", req));
    }
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
