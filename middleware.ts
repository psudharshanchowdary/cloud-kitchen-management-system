import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Protected paths list
  const isProtectedRoute = 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/kitchen") ||
    pathname.startsWith("/menu") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/suppliers") ||
    pathname.startsWith("/packing") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/ai-assistant") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  const isAuthRoute = pathname.startsWith("/login");

  // If user is accessing a protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    // Remember redirect destination
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is accessing login with a valid token, redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/kitchen/:path*",
    "/menu/:path*",
    "/inventory/:path*",
    "/staff/:path*",
    "/attendance/:path*",
    "/expenses/:path*",
    "/suppliers/:path*",
    "/packing/:path*",
    "/analytics/:path*",
    "/ai-assistant/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
    "/"
  ],
};
