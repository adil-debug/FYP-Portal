import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Routes that don't require a logged-in session.
const PUBLIC_PATHS = ["/login"];

// Route prefixes that require the COORDINATOR role specifically.
const COORDINATOR_ONLY_PREFIXES = ["/coordinator"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never gate API routes here — each Route Handler is responsible for
  // checking its own session (see src/lib/session.ts), so a proxy bug
  // can't silently leave an API route unprotected or, worse, block one
  // that should be public (e.g. /api/auth/login itself).
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiresCoordinator = COORDINATOR_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (requiresCoordinator && session.role !== "COORDINATOR") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except static assets and image optimization files.
    // (API routes are excluded above, inside the function, rather than
    // here, so login/logout keep working even if this matcher changes.)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
