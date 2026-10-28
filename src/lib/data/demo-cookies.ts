import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Utilidades de cookies firmadas para el modo demostración. */

export const COOKIE_DAYS = 30;
const SECRET = process.env.SESSION_SECRET ?? "masquepadel-demo-secret-cambiar-en-produccion";

/** Número pseudoaleatorio estable en [0, 1) para un texto dado. */
export function stableRandom(key: string): number {
  return createHmac("sha256", "masquepadel-seed").update(key).digest().readUInt32BE(0) / 2 ** 32;
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

export function encode(data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decode<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_DAYS * 86400,
});

