import crypto from "crypto";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

/**
 * Generate a session token from the admin password.
 * Uses SHA-256 with a server-side secret to create a deterministic token.
 */
export function generateAdminToken(password: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || "geego-admin-secret-default";
  return crypto
    .createHash("sha256")
    .update(`${password}:${secret}`)
    .digest("hex");
}

/**
 * Verify that the incoming request has a valid admin session cookie.
 * Returns true if the cookie matches the expected token for ADMIN_PASSWORD.
 */
export function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return false;
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) {
    return false;
  }

  const expectedToken = generateAdminToken(adminPassword);
  return crypto.timingSafeEqual(
    Buffer.from(cookie.value),
    Buffer.from(expectedToken)
  );
}

export { COOKIE_NAME };
