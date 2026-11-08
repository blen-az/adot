import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { unitMedia, units, type Availability, type Unit, type UnitMedia } from "@/db/schema";
import { recordAudit } from "./audit";
import { ValidationError } from "./errors";
import { assertCan, type Actor } from "./permissions";
import { getListUnderDiscussion } from "./settings";

export type UnitWithMedia = Unit & { media: UnitMedia[] };

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : v),
  z.coerce.number().positive().nullable(),
);

export const unitInput = z
  .object({
    reference: z.string().trim().min(1, "Reference is required"),
    floor: z.string().trim().min(1, "Floor is required"),
    category: z.string().trim().min(1, "Category is required"),
    areaM2: optionalNumber,
    titleEn: z.string().trim().min(1, "English title is required"),
    titleAm: z.string().trim().default(""),
    descriptionEn: z.string().trim().default(""),
    descriptionAm: z.string().trim().default(""),
    permittedUseEn: z.string().trim().default(""),
    permittedUseAm: z.string().trim().default(""),
    featuresEn: z.array(z.string().trim().min(1)).default([]),
    featuresAm: z.array(z.string().trim().min(1)).default([]),
    rentEtb: optionalNumber,
    billingPeriod: z.preprocess((v) => v || null, z.enum(["monthly", "quarterly", "annual"]).nullable()),
    serviceChargeEtb: optionalNumber,
    rentPublic: z.boolean().default(false),
    availableFrom: z.preprocess((v) => v || null, z.string().date().nullable()),
  })
  .refine((v) => v.rentEtb === null || v.billingPeriod !== null, {
    message: "Rent needs a billing period",
    path: ["billingPeriod"],
  });

type OptionalUnitFields = "areaM2" | "rentEtb" | "billingPeriod" | "serviceChargeEtb" | "availableFrom";
type RawUnitInput = z.input<typeof unitInput>;
export type UnitInput = Omit<RawUnitInput, OptionalUnitFields> & Partial<Pick<RawUnitInput, OptionalUnitFields>>;

function parseUnit(input: UnitInput) {
  const parsed = unitInput.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues.map((i) => i.message));
  const { areaM2, rentEtb, serviceChargeEtb, ...rest } = parsed.data;
  return {
    ...rest,
    areaM2: areaM2?.toString() ?? null,
    rentEtb: rentEtb?.toString() ?? null,
    serviceChargeEtb: serviceChargeEtb?.toString() ?? null,
  };
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "unit"}-${randomBytes(3).toString("hex")}`;
}

export async function createUnit(db: Db, actor: Actor, input: UnitInput) {
  assertCan(actor, "units.edit");
  const values = parseUnit(input);
  const [unit] = await db
    .insert(units)
    .values({ ...values, slug: slugify(values.titleEn), createdBy: actor.id, updatedBy: actor.id })
    .returning();
  await recordAudit(db, { actorId: actor.id, action: "unit.created", entityType: "unit", entityId: unit.id });
  return unit;
}

export async function updateUnit(db: Db, actor: Actor, id: string, input: UnitInput) {
  assertCan(actor, "units.edit");
  const values = parseUnit(input);
  const current = await requireUnit(db, id);
  if (current.publication === "published") {
    const issues = publishIssues({ ...current, ...values, media: await listMedia(db, id) });
    if (issues.length) throw new ValidationError(issues);
  }
  const [unit] = await db
    .update(units)
    .set({ ...values, updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(units.id, id))
    .returning();
  await recordAudit(db, { actorId: actor.id, action: "unit.updated", entityType: "unit", entityId: id });
  return unit;
}

async function requireUnit(db: Db, id: string) {
  const [unit] = await db.select().from(units).where(eq(units.id, id));
  if (!unit) throw new ValidationError(["Unit not found"]);
  return unit;
}

function listMedia(db: Db, unitId: string) {
  return db.select().from(unitMedia).where(eq(unitMedia.unitId, unitId)).orderBy(asc(unitMedia.position));
}

export function publishIssues(unit: UnitWithMedia) {
  const issues: string[] = [];
  if (!unit.titleEn) issues.push("Title is required");
  if (!unit.floor) issues.push("Floor is required");
  if (!unit.areaM2) issues.push("Area is required");
  if (!unit.descriptionEn) issues.push("Description is required");
  if (unit.media.length === 0) issues.push("At least one image is required");
  if (unit.media.some((m) => !m.altEn)) issues.push("Every image needs English alternative text");
  return issues;
}

export function translationWarnings(unit: UnitWithMedia) {
  const warnings: string[] = [];
  if (!unit.titleAm) warnings.push("Amharic title is missing");
  if (!unit.descriptionAm) warnings.push("Amharic description is missing");
  if (unit.permittedUseEn && !unit.permittedUseAm) warnings.push("Amharic permitted use is missing");
  if (unit.featuresEn.length !== unit.featuresAm.length) warnings.push("Amharic features do not match the English list");
  if (unit.media.some((m) => !m.altAm)) warnings.push("Amharic alternative text is missing on an image");
  return warnings;
}

async function setPublication(db: Db, actor: Actor, id: string, publication: Unit["publication"], action: string) {
  await db.update(units).set({ publication, updatedBy: actor.id, updatedAt: new Date() }).where(eq(units.id, id));
  await recordAudit(db, { actorId: actor.id, action, entityType: "unit", entityId: id });
}

export async function publishUnit(db: Db, actor: Actor, id: string) {
  assertCan(actor, "units.edit");
  const unit = await requireUnit(db, id);
  const issues = publishIssues({ ...unit, media: await listMedia(db, id) });
  if (issues.length) throw new ValidationError(issues);
  await setPublication(db, actor, id, "published", "unit.published");
}

export async function unpublishUnit(db: Db, actor: Actor, id: string) {
  assertCan(actor, "units.edit");
  await setPublication(db, actor, id, "draft", "unit.unpublished");
}

export async function archiveUnit(db: Db, actor: Actor, id: string) {
  assertCan(actor, "units.edit");
  await setPublication(db, actor, id, "archived", "unit.archived");
}

export async function restoreUnit(db: Db, actor: Actor, id: string) {
  assertCan(actor, "units.edit");
  await setPublication(db, actor, id, "draft", "unit.restored");
}

export async function setAvailability(db: Db, actor: Actor, id: string, availability: Availability) {
  assertCan(actor, "units.availability");
  const before = await requireUnit(db, id);
  await db.update(units).set({ availability, updatedBy: actor.id, updatedAt: new Date() }).where(eq(units.id, id));
  await recordAudit(db, {
    actorId: actor.id,
    action: "unit.availability_changed",
    entityType: "unit",
    entityId: id,
    detail: { from: before.availability, to: availability },
  });
}

/** The single definition of "can the public see and enquire about this unit". */
export function isEligible(unit: Pick<Unit, "publication" | "availability">, listUnderDiscussion: boolean) {
  if (unit.publication !== "published") return false;
  return unit.availability === "available" || (unit.availability === "under_discussion" && listUnderDiscussion);
}

async function eligibleAvailabilities(db: Db): Promise<Availability[]> {
  return (await getListUnderDiscussion(db)) ? ["available", "under_discussion"] : ["available"];
}

export type UnitFilters = { floor?: string; category?: string; minArea?: number; maxArea?: number };

async function withMedia(db: Db, rows: Unit[]): Promise<UnitWithMedia[]> {
  if (rows.length === 0) return [];
  const media = await db
    .select()
    .from(unitMedia)
    .where(
      inArray(
        unitMedia.unitId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(unitMedia.position));
  return rows.map((row) => ({ ...row, media: media.filter((m) => m.unitId === row.id) }));
}

export async function listPublicUnits(db: Db, filters: UnitFilters = {}) {
  const rows = await db
    .select()
    .from(units)
    .where(
      and(
        eq(units.publication, "published"),
        inArray(units.availability, await eligibleAvailabilities(db)),
        filters.floor ? eq(units.floor, filters.floor) : undefined,
        filters.category ? eq(units.category, filters.category) : undefined,
        filters.minArea ? gte(units.areaM2, filters.minArea.toString()) : undefined,
        filters.maxArea ? lte(units.areaM2, filters.maxArea.toString()) : undefined,
      ),
    )
    .orderBy(desc(units.updatedAt));
  return withMedia(db, rows);
}

export async function publicFilterOptions(db: Db) {
  const rows = await db
    .select({ floor: units.floor, category: units.category })
    .from(units)
    .where(and(eq(units.publication, "published"), inArray(units.availability, await eligibleAvailabilities(db))));
  return {
    floors: [...new Set(rows.map((r) => r.floor))].sort(),
    categories: [...new Set(rows.map((r) => r.category))].sort(),
  };
}

export type PublicUnitResult =
  | { state: "active"; unit: UnitWithMedia }
  | { state: "unavailable" }
  | { state: "not_found" };

export async function getPublicUnit(db: Db, slug: string): Promise<PublicUnitResult> {
  const [row] = await db.select().from(units).where(eq(units.slug, slug));
  if (!row || row.publication === "draft") return { state: "not_found" };
  if (!isEligible(row, await getListUnderDiscussion(db))) return { state: "unavailable" };
  const [unit] = await withMedia(db, [row]);
  return { state: "active", unit };
}

export async function getUnitForStaff(db: Db, actor: Actor, id: string) {
  assertCan(actor, "units.edit");
  const [row] = await db.select().from(units).where(eq(units.id, id));
  if (!row) return null;
  const [unit] = await withMedia(db, [row]);
  return unit;
}

export async function listUnitsForStaff(db: Db, actor: Actor) {
  assertCan(actor, "units.edit");
  return db.select().from(units).orderBy(desc(units.updatedAt));
}

export async function listUnitsWithMediaForStaff(db: Db, actor: Actor) {
  return withMedia(db, await listUnitsForStaff(db, actor));
}

/** Counts and to-do items for the dashboard overview. Archived units are left out of the to-do list. */
export async function unitSummary(db: Db, actor: Actor) {
  const all = await listUnitsWithMediaForStaff(db, actor);
  const count = <T extends string>(values: T[]) =>
    values.reduce<Partial<Record<T, number>>>((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
  const published = all.filter((unit) => unit.publication === "published");
  const attention = all
    .filter((unit) => unit.publication !== "archived")
    .map((unit) => ({
      unit,
      issues: unit.publication === "draft" ? publishIssues(unit) : [],
      warnings: translationWarnings(unit),
    }))
    .filter((item) => item.issues.length > 0 || item.warnings.length > 0);
  return {
    total: all.length,
    byPublication: count(all.map((unit) => unit.publication)),
    byAvailability: count(published.map((unit) => unit.availability)),
    attention,
  };
}

export async function addMedia(
  db: Db,
  actor: Actor,
  unitId: string,
  media: { fileName: string; altEn: string; altAm: string },
) {
  assertCan(actor, "units.edit");
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${unitMedia.position}) + 1, 0)` })
    .from(unitMedia)
    .where(eq(unitMedia.unitId, unitId));
  await db.insert(unitMedia).values({ ...media, unitId, position: next });
}

export async function moveMedia(db: Db, actor: Actor, unitId: string, mediaId: string, direction: -1 | 1) {
  assertCan(actor, "units.edit");
  const media = await listMedia(db, unitId);
  const index = media.findIndex((m) => m.id === mediaId);
  const other = media[index + direction];
  if (index < 0 || !other) return;
  await db.update(unitMedia).set({ position: other.position }).where(eq(unitMedia.id, mediaId));
  await db.update(unitMedia).set({ position: media[index].position }).where(eq(unitMedia.id, other.id));
}

export async function removeMedia(db: Db, actor: Actor, unitId: string, mediaId: string) {
  assertCan(actor, "units.edit");
  const media = await listMedia(db, unitId);
  const unit = await requireUnit(db, unitId);
  if (unit.publication === "published" && media.length === 1) {
    throw new ValidationError(["A published unit must keep at least one image"]);
  }
  await db.delete(unitMedia).where(and(eq(unitMedia.id, mediaId), eq(unitMedia.unitId, unitId)));
}
