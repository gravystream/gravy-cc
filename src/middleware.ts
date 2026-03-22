import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
 
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
 
  const isLoggedIn = !!token;
  const needsOnboarding = token?.needsOnboarding === true;
 
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api");
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/creator/") ||
    pathname.startsWith("/how-it-works") ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");
 
  // Allow API routes and public routes through
  if (isApiRoute || isPublicRoute) {
    return NextResponse.next();
  }
 
  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    if (needsOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
 
  // Allow unauthenticated users to access auth pages
  if (isAuthRoute && !isLoggedIn) {
    return NextResponse.next();
  }
 
  // Protect onboarding routes
  if (isOnboardingRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!needsOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }
 
  // Protect dashboard routes
  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (needsOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }
 
  // All other routes: pass through
  return NextResponse.next();
}
 
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
