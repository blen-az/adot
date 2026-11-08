import { describe, expect, it } from "vitest";
import { enquiries } from "@/db/schema";
import { enquirySummary, newEnquiryCount, setEnquiryStatus, submitEnquiry } from "@/server/enquiries";
import { ForbiddenError, ValidationError } from "@/server/errors";
import { getSiteImages, resetSiteImage, setSiteImage } from "@/server/site-images";
import { createUnit, unitSummary } from "@/server/units";
import { enquiry, makeUser, publishedUnit, testDb, unitValues } from "./helpers";

describe("site images", () => {
  it("falls back to the bundled photos", async () => {
    const db = await testDb();
    const images = await getSiteImages(db);
    expect(images.gym).toMatchObject({ custom: false, src: "/assets/images/adot-gymnasium-interior.webp", altEn: null });
    expect(images.gym.cardSrc).toBe("/assets/images/adot-gymnasium-interior-card.webp");
  });

  it("replaces and resets one slot without touching the others", async () => {
    const db = await testDb();
    const editor = { ...(await makeUser(db, "content_editor")), name: "Sample Editor" };
    await setSiteImage(db, editor, "gym", { fileName: "a.jpg", altEn: " Weights room ", altAm: "" });
    await setSiteImage(db, editor, "facade", { fileName: "b.jpg", altEn: "Front", altAm: "ፊት" });

    let images = await getSiteImages(db);
    expect(images.gym).toMatchObject({ custom: true, src: "/media/a.jpg", cardSrc: "/media/a.jpg", altEn: "Weights room", altAm: null, updatedBy: "Sample Editor" });
    expect(images.facade).toMatchObject({ src: "/media/b.jpg", altAm: "ፊት" });

    await resetSiteImage(db, editor, "gym");
    images = await getSiteImages(db);
    expect(images.gym.custom).toBe(false);
    expect(images.facade.custom).toBe(true);
  });

  it("requires alt text, a known slot and content permission", async () => {
    const db = await testDb();
    const editor = { ...(await makeUser(db, "content_editor")), name: "Editor" };
    const leasing = { ...(await makeUser(db, "leasing_staff")), name: "Leasing" };
    await expect(setSiteImage(db, editor, "gym", { fileName: "a.jpg", altEn: " ", altAm: "" })).rejects.toThrow(ValidationError);
    await expect(setSiteImage(db, editor, "toString", { fileName: "a.jpg", altEn: "x", altAm: "" })).rejects.toThrow(
      ValidationError,
    );
    await expect(setSiteImage(db, leasing, "gym", { fileName: "a.jpg", altEn: "x", altAm: "" })).rejects.toThrow(
      ForbiddenError,
    );
  });
});

describe("overview summaries", () => {
  it("counts units and lists the ones that need work", async () => {
    const db = await testDb();
    const { admin } = await publishedUnit(db);
    const draft = await createUnit(db, admin, { ...unitValues, reference: "F-01", titleEn: "Draft office" });

    const summary = await unitSummary(db, admin);
    expect(summary.total).toBe(2);
    expect(summary.byPublication).toEqual({ published: 1, draft: 1 });
    expect(summary.byAvailability).toEqual({ available: 1 });
    const item = summary.attention.find((entry) => entry.unit.id === draft.id);
    expect(item?.issues).toContain("At least one image is required");
  });

  it("counts enquiries by status and lists recent ones", async () => {
    const db = await testDb();
    const { unit, admin } = await publishedUnit(db);
    await submitEnquiry(db, enquiry(unit.id), []);
    await submitEnquiry(db, enquiry(unit.id), []);
    const [first] = await db.select().from(enquiries).limit(1);
    await setEnquiryStatus(db, admin, first.id, "contacted");

    const summary = await enquirySummary(db, admin);
    expect(summary.byStatus).toEqual({ new: 1, contacted: 1 });
    expect(summary).toMatchObject({ open: 2, lastWeek: 2, unassigned: 2, failedNotifications: 0 });
    expect(summary.recent).toHaveLength(2);
    expect(await newEnquiryCount(db, admin)).toBe(1);
  });

  it("is not available to content editors", async () => {
    const db = await testDb();
    const editor = await makeUser(db, "content_editor");
    await expect(enquirySummary(db, editor)).rejects.toThrow(ForbiddenError);
  });
});
