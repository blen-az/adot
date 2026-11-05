import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { hashPassword, login, logout, userForToken } from "@/server/auth";
import { sniffImage } from "@/server/media";
import { testDb } from "./helpers";

let db: Db;

beforeEach(async () => {
  db = await testDb();
  await db.insert(users).values({
    email: "staff@example.com",
    name: "Staff",
    role: "leasing_staff",
    passwordHash: await hashPassword("correct horse"),
  });
});

describe("sign-in", () => {
  it("creates a session for valid credentials and ends it on logout", async () => {
    const session = await login(db, "Staff@Example.com ", "correct horse");
    expect(session).not.toBeNull();
    expect((await userForToken(db, session!.token))?.email).toBe("staff@example.com");
    await logout(db, session!.token);
    expect(await userForToken(db, session!.token)).toBeNull();
  });

  it("stores only a hash of the session token", async () => {
    const session = await login(db, "staff@example.com", "correct horse");
    const [row] = await db.select().from(sessions);
    expect(row.tokenHash).not.toBe(session!.token);
  });

  it("rejects wrong passwords and unknown accounts", async () => {
    expect(await login(db, "staff@example.com", "wrong")).toBeNull();
    expect(await login(db, "nobody@example.com", "correct horse")).toBeNull();
  });

  it("rejects expired sessions", async () => {
    const session = await login(db, "staff@example.com", "correct horse");
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await userForToken(db, session!.token)).toBeNull();
  });

  it("rejects deactivated users, including existing sessions", async () => {
    const session = await login(db, "staff@example.com", "correct horse");
    await db.update(users).set({ active: false }).where(eq(users.email, "staff@example.com"));
    expect(await userForToken(db, session!.token)).toBeNull();
    expect(await login(db, "staff@example.com", "correct horse")).toBeNull();
  });
});

describe("upload checks", () => {
  it("identifies images by content, not file name", () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    expect(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(sniffImage(Buffer.from("RIFF0000WEBP"))).toBe("webp");
    expect(sniffImage(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImage(Buffer.from("<html>"))).toBeNull();
  });
});
