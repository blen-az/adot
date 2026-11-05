import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import type { Db } from "@/db/client";
import { sessions, users } from "@/db/schema";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_HOURS = 8;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  const derived = await scrypt(password, Buffer.from(salt, "hex"), 64);
  return timingSafeEqual(derived, Buffer.from(key, "hex"));
}

// Compared against when the email is unknown, so response time does not reveal which accounts exist.
const decoyHash = hashPassword(randomBytes(16).toString("hex"));

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function login(db: Db, email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
  const valid = await verifyPassword(password, user?.passwordHash ?? (await decoyHash));
  if (!user || !valid || !user.active) return null;
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId: user.id, expiresAt });
  return { token, expiresAt };
}

export async function userForToken(db: Db, token: string) {
  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), eq(users.active, true)));
  return row ?? null;
}

export async function logout(db: Db, token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
