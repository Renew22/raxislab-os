import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "raxislab_fallback_secret_change_in_prod"
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "CLIENT";
  clientId?: string;
  clientSlug?: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("raxislab_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function hashPassword(password: string): Promise<string> {
  const bcrypt = require("bcryptjs");
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require("bcryptjs");
  return bcrypt.compare(password, hash);
}
