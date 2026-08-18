import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { parseRole, type Role } from "@/lib/roles";

export const SESSION_COOKIE = "tc_session";

export type SessionUser = {
  employeeId: string;
  businessId: string;
  role: Role;
  email: string;
  name: string;
  mustChangePin: boolean;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export function sessionFromPayload(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== "object") return null;
  const user = payload as Record<string, unknown>;
  if (!isUuid(user.employeeId) || !isUuid(user.businessId)) return null;
  if (typeof user.email !== "string" || !user.email.includes("@")) return null;
  if (typeof user.name !== "string" || !user.name.trim()) return null;
  return {
    employeeId: user.employeeId,
    businessId: user.businessId,
    role: parseRole(user.role),
    email: user.email.trim().toLowerCase(),
    name: user.name.trim(),
    mustChangePin: user.mustChangePin === true,
  };
}

export async function parseSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return sessionFromPayload(payload);
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
