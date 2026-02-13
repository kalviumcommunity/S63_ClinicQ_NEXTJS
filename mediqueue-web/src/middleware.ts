import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { securityMiddleware, rateLimitMiddleware } from "./middleware/security";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "development-secret-change-in-production";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Apply security middleware first
  const securityResponse = securityMiddleware(req);
  if (securityResponse.status === 400) {
    return securityResponse;
  }

  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(req);
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }

  // Skip auth for public routes
  if (pathname.startsWith("/login") || pathname === "/" || pathname.startsWith("/security-demo")) {
    return securityResponse;
  }

  // Auth middleware for protected routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/users")) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(AUTH_SECRET);
      await jwtVerify(token, secret);
      return securityResponse;
    } catch {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return securityResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
