import { createPgliteDb, type Db } from "@/db/client";
import { users, type Role } from "@/db/schema";
import { addMedia, createUnit, publishUnit, type UnitInput } from "@/server/units";
import type { EnquiryInput } from "@/server/enquiries";
import { randomUUID } from "node:crypto";

export function testDb() {
  return createPgliteDb();
}

export async function makeUser(db: Db, role: Role, name: string = role) {
  const [user] = await db
    .insert(users)
    .values({ email: `${randomUUID()}@example.com`, name, passwordHash: "x", role })
    .returning();
  return { id: user.id, role };
}

export const unitValues: UnitInput = {
  reference: "G-12",
  floor: "Ground",
  category: "Retail",
  areaM2: 85,
  titleEn: "Ground floor retail unit",
  descriptionEn: "A corner unit.",
};

export async function publishedUnit(db: Db, overrides: Partial<UnitInput> = {}) {
  const admin = await makeUser(db, "administrator");
  const unit = await createUnit(db, admin, { ...unitValues, ...overrides });
  await addMedia(db, admin, unit.id, { fileName: "a.jpg", altEn: "Shopfront", altAm: "" });
  await publishUnit(db, admin, unit.id);
  return { unit, admin };
}

export function enquiry(unitId: string | null, overrides: Partial<EnquiryInput> = {}): EnquiryInput {
  return {
    idempotencyKey: randomUUID(),
    type: unitId ? "unit" : "future_availability",
    unitId,
    name: "Hana Bekele",
    phone: "0911 234 567",
    intendedUse: "Coffee shop",
    message: "Is this suitable for a cafe?",
    locale: "en",
    ...overrides,
  };
}
