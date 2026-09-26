import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/client";

const SESSION_COOKIE_NAME = "portal_session";
// Fixed expiry from the moment of login — not sliding/inactivity-based.
// A session created at login is dead exactly 1 hour later regardless of
// activity, and the user is redirected to /login to sign in again.
const SESSION_DURATION_SECONDS = 60 * 60; // 1 hour

function getSessionSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to your .env file (see .env.example).",
    );
  }
  return new TextEncoder().encode(secret);
}

// ── Password hashing ────────────────────────────────────────────────────

export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainPassword, saltRounds);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

// ── Session tokens (JWT stored in an httpOnly cookie) ───────────────────

export type SessionPayload = {
  userId: string;
  role: Role;
  name: string;
  email: string;
};

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const key = getSessionSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const key = getSessionSecretKey();
    const { payload } = await jwtVerify(token, key);
    if (
      typeof payload.userId === "string" &&
      typeof payload.role === "string" &&
      typeof payload.name === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        userId: payload.userId,
        role: payload.role as Role,
        name: payload.name,
        email: payload.email,
      };
    }
    return null;
  } catch {
    // Invalid signature, malformed token, or expired.
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };
