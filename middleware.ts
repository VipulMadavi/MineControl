import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/login", "/unauthorized"].includes(nextUrl.pathname);

  // Allow all auth API endpoints
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Redirect to login if user is not authenticated and trying to access a protected route
  if (!isLoggedIn) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  // Check authorization from session context
  const isAuthorized = !!req.auth?.user?.isAuthorized;

  if (!isAuthorized) {
    if (nextUrl.pathname !== "/unauthorized") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
    return NextResponse.next();
  }

  // User is authorized: redirect away from login/unauthorized to dashboard
  if (isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - png/svg/jpg (static images)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.png$|.*\.svg$|.*\.jpg$).*)",
  ],
};
