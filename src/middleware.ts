import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/api/user", "/api/carousel", "/api/calendar", "/admin", "/api/admin"];
const AUTH_PATHS = ["/login", "/register"];
const COOKIE_NAME = "nc_token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (isProtected) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    try {
      await verifyToken(token);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete(COOKIE_NAME);
      return res;
    }
  }

  if (isAuthPage && token) {
    try {
      await verifyToken(token);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/user/:path*",
    "/api/carousel/:path*",
    "/api/calendar/:path*",
    "/api/admin/:path*",
    "/login",
    "/register",
  ],
};
