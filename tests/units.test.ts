import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { ForbiddenError, ValidationError } from "@/server/errors";
import { setListUnderDiscussion } from "@/server/settings";
import {
  addMedia,
  archiveUnit,
  createUnit,
  getPublicUnit,
  listPublicUnits,
  moveMedia,
  getUnitForStaff,
  publishUnit,
  removeMedia,
  restoreUnit,
  setAvailability,
  translationWarnings,
  updateUnit,
} from "@/server/units";
import { makeUser, publishedUnit, testDb, unitValues } from "./helpers";

let db: Db;

beforeEach(async () => {
  db = await testDb();
});

describe("publishing", () => {
  it("blocks publication until required content and an image exist (FR-015)", async () => {
    const admin = await makeUser(db, "administrator");
    const unit = await createUnit(db, admin, { ...unitValues, descriptionEn: "", areaM2: "" });
    await expect(publishUnit(db, admin, unit.id)).rejects.toThrow(ValidationError);
    await expect(publishUnit(db, admin, unit.id)).rejects.toThrow(/Area is required/);
    await expect(publishUnit(db, admin, unit.id)).rejects.toThrow(/At least one image/);
  });

  it("keeps drafts hidden and returns 404 state for them", async () => {
    const admin = await makeUser(db, "administrator");
    const unit = await createUnit(db, admin, unitValues);
    expect(await listPublicUnits(db)).toHaveLength(0);
    expect((await getPublicUnit(db, unit.slug)).state).toBe("not_found");
  });

  it("publishes, archives and restores a unit (FR-010)", async () => {
    const { unit, admin } = await publishedUnit(db);
    expect(await listPublicUnits(db)).toHaveLength(1);
    await archiveUnit(db, admin, unit.id);
    expect(await listPublicUnits(db)).toHaveLength(0);
    expect((await getPublicUnit(db, unit.slug)).state).toBe("unavailable");
    await restoreUnit(db, admin, unit.id);
    expect((await getPublicUnit(db, unit.slug)).state).toBe("not_found");
  });

  it("rejects rent without a billing period (FR-013)", async () => {
    const admin = await makeUser(db, "administrator");
    await expect(createUnit(db, admin, { ...unitValues, rentEtb: 50000 })).rejects.toThrow(/billing period/);
  });

  it("will not let a published unit lose required content", async () => {
    const { unit, admin } = await publishedUnit(db);
    await expect(updateUnit(db, admin, unit.id, { ...unitValues, descriptionEn: "" })).rejects.toThrow(/Description/);
  });

  it("will not let a published unit lose its last image", async () => {
    const { unit, admin } = await publishedUnit(db);
    const staffView = await getUnitForStaff(db, admin, unit.id);
    await expect(removeMedia(db, admin, unit.id, staffView!.media[0].id)).rejects.toThrow(/at least one image/);
  });

  it("flags missing Amharic without blocking publication", async () => {
    const { unit, admin } = await publishedUnit(db);
    const staffView = await getUnitForStaff(db, admin, unit.id);
    expect(translationWarnings(staffView!)).toContain("Amharic title is missing");
    expect((await getPublicUnit(db, unit.slug)).state).toBe("active");
  });

  it("persists gallery order (FR-012)", async () => {
    const { unit, admin } = await publishedUnit(db);
    await addMedia(db, admin, unit.id, { fileName: "b.jpg", altEn: "Interior", altAm: "" });
    const before = await getUnitForStaff(db, admin, unit.id);
    await moveMedia(db, admin, unit.id, before!.media[1].id, -1);
    const after = await getUnitForStaff(db, admin, unit.id);
    expect(after!.media.map((m) => m.fileName)).toEqual(["b.jpg", "a.jpg"]);
  });
});

describe("availability", () => {
  it("removes leased units immediately and leaves publication unchanged (FR-014, FR-017)", async () => {
    const { unit, admin } = await publishedUnit(db);
    await setAvailability(db, admin, unit.id, "leased");
    expect(await listPublicUnits(db)).toHaveLength(0);
    expect((await getPublicUnit(db, unit.slug)).state).toBe("unavailable");
    const staffView = await getUnitForStaff(db, admin, unit.id);
    expect(staffView?.publication).toBe("published");
  });

  it("lists Under discussion units only when management allows it (FR-016)", async () => {
    const { unit, admin } = await publishedUnit(db);
    await setAvailability(db, admin, unit.id, "under_discussion");
    expect(await listPublicUnits(db)).toHaveLength(0);
    await setListUnderDiscussion(db, admin, true);
    expect(await listPublicUnits(db)).toHaveLength(1);
  });

  it("does not let content editors change availability", async () => {
    const { unit } = await publishedUnit(db);
    const editor = await makeUser(db, "content_editor");
    await expect(setAvailability(db, editor, unit.id, "leased")).rejects.toThrow(ForbiddenError);
  });
});

describe("filters", () => {
  it("matches floor, category and area (FR-018)", async () => {
    await publishedUnit(db, { floor: "Ground", category: "Retail", areaM2: 50 });
    await publishedUnit(db, { floor: "First", category: "Office", areaM2: 200 });
    expect(await listPublicUnits(db, { floor: "First" })).toHaveLength(1);
    expect(await listPublicUnits(db, { category: "Retail" })).toHaveLength(1);
    expect(await listPublicUnits(db, { minArea: 100 })).toHaveLength(1);
    expect(await listPublicUnits(db, { maxArea: 100 })).toHaveLength(1);
    expect(await listPublicUnits(db, { minArea: 300 })).toHaveLength(0);
  });
});
