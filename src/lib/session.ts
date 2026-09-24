import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "@/lib/auth";

/**
 * Reads and verifies the current session from the httpOnly cookie.
 * Returns null if there is no session, or if it is invalid/expired.
 *
 * Safe to call from Server Components, Route Handlers, and Server Functions.
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Like getCurrentUser, but throws if there is no valid session. Use this
 * in places that should never be reached by an unauthenticated request
 * (proxy.ts should already have redirected them), so a throw here means
 * something is actually wrong rather than "please log in".
 */
export async function requireUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No authenticated session found.");
  }
  return user;
}

/**
 * Like requireUser, but also asserts the session belongs to a Coordinator.
 * Use in coordinator-only Route Handlers / Server Functions as defense in
 * depth alongside proxy.ts's route protection.
 */
export async function requireCoordinator(): Promise<SessionPayload> {
  const user = await requireUser();
  if (user.role !== "COORDINATOR") {
    throw new Error("This action requires a Coordinator account.");
  }
  return user;
}
