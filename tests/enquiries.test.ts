import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/client";
import { auditLog, enquiries, notificationAttempts, units } from "@/db/schema";
import {
  addEnquiryNote,
  assignEnquiry,
  getEnquiryDetail,
  listInbox,
  normalisePhone,
  processNotifications,
  retryNotification,
  setEnquiryStatus,
  submitEnquiry,
} from "@/server/enquiries";
import { ForbiddenError } from "@/server/errors";
import type { Mailer } from "@/server/mailer";
import { hitRateLimit } from "@/server/rate-limit";
import { archiveUnit, setAvailability, updateUnit } from "@/server/units";
import { enquiry, makeUser, publishedUnit, testDb, unitValues } from "./helpers";

let db: Db;
const recipients = ["leasing@example.com"];

beforeEach(async () => {
  db = await testDb();
});

async function saved(unitId: string | null = null) {
  const result = await submitEnquiry(db, enquiry(unitId), recipients);
  if (result.status !== "saved") throw new Error(`Expected saved, got ${result.status}`);
  const [row] = await db.select().from(enquiries).where(eq(enquiries.reference, result.reference));
  return row;
}

describe("phone numbers", () => {
  it.each([
    ["0911 234 567", "+251911234567"],
    ["0711-234-567", "+251711234567"],
    ["+251 911 234 567", "+251911234567"],
    ["+44 20 7946 0958", "+442079460958"],
  ])("accepts %s", (input, expected) => {
    expect(normalisePhone(input)).toBe(expected);
  });

  it.each(["12345", "abc", "0811234567", ""])("rejects %s", (input) => {
    expect(normalisePhone(input)).toBeNull();
  });
});

describe("submission", () => {
  it("saves one unit-linked record with a snapshot and reference (FR-030, FR-034)", async () => {
    const { unit } = await publishedUnit(db);
    const row = await saved(unit.id);
    expect(row.reference).toMatch(/^ADT-\d{4}-[0-9A-Z]{6}$/);
    expect(row.unitId).toBe(unit.id);
    expect(row.unitSnapshot).toEqual({ title: unitValues.titleEn, reference: "G-12", floor: "Ground" });
    expect(row.status).toBe("new");
  });

  it("reports each missing required field (FR-031)", async () => {
    const { unit } = await publishedUnit(db);
    const result = await submitEnquiry(
      db,
      enquiry(unit.id, { name: "", phone: "nope", intendedUse: " ", message: "" }),
      recipients,
    );
    expect(result).toEqual({ status: "invalid", fields: ["name", "phone", "intendedUse", "message"] });
    expect(await db.select().from(enquiries)).toHaveLength(0);
  });

  it("does not require marketing consent (FR-032)", async () => {
    const row = await saved();
    expect(row.marketingConsent).toBe(false);
  });

  it("creates one record for repeat submissions, sequential or concurrent (FR-035)", async () => {
    const { unit } = await publishedUnit(db);
    const input = enquiry(unit.id);
    const results = await Promise.all([
      submitEnquiry(db, input, recipients),
      submitEnquiry(db, input, recipients),
      submitEnquiry(db, input, recipients),
    ]);
    const again = await submitEnquiry(db, input, recipients);
    expect(await db.select().from(enquiries)).toHaveLength(1);
    expect(await db.select().from(notificationAttempts)).toHaveLength(1);
    expect(new Set([...results, again].map((r) => r.status === "saved" && r.reference)).size).toBe(1);
  });

  it("rejects tampered and unknown unit IDs (FR-033)", async () => {
    expect((await submitEnquiry(db, enquiry("not-a-uuid"), recipients)).status).toBe("unit_unavailable");
    expect(
      (await submitEnquiry(db, enquiry("00000000-0000-4000-8000-000000000000"), recipients)).status,
    ).toBe("unit_unavailable");
  });

  it("rejects a unit leased after the page loaded (J4)", async () => {
    const { unit, admin } = await publishedUnit(db);
    await setAvailability(db, admin, unit.id, "leased");
    expect((await submitEnquiry(db, enquiry(unit.id), recipients)).status).toBe("unit_unavailable");
    expect(await db.select().from(enquiries)).toHaveLength(0);
  });

  it("does not change unit availability", async () => {
    const { unit } = await publishedUnit(db);
    await saved(unit.id);
    const [row] = await db.select().from(units).where(eq(units.id, unit.id));
    expect(row.availability).toBe("available");
  });

  it("keeps snapshots when the unit later changes or is archived (FR-040)", async () => {
    const { unit, admin } = await publishedUnit(db);
    const row = await saved(unit.id);
    await updateUnit(db, admin, unit.id, { ...unitValues, titleEn: "Renamed" });
    await archiveUnit(db, admin, unit.id);
    const [after] = await db.select().from(enquiries).where(eq(enquiries.id, row.id));
    expect(after.unitSnapshot?.title).toBe(unitValues.titleEn);
    expect(after.unitId).toBe(unit.id);
  });

  it("accepts future availability requests with no unit (FR-041)", async () => {
    const row = await saved();
    expect(row.type).toBe("future_availability");
    expect(row.unitId).toBeNull();
  });
});

describe("notifications", () => {
  const working = (): Mailer & { send: ReturnType<typeof vi.fn> } => ({ send: vi.fn().mockResolvedValue(undefined) });
  const broken = (): Mailer => ({ send: vi.fn().mockRejectedValue(new Error("SMTP down")) });

  it("keeps the lead when mail fails, then delivers once on retry (FR-036, UAT-05)", async () => {
    const row = await saved();
    await processNotifications(db, broken());
    const [failed] = await db.select().from(notificationAttempts);
    expect(failed.status).toBe("failed");
    expect(failed.lastError).toBe("SMTP down");
    expect(await db.select().from(enquiries)).toHaveLength(1);

    const admin = await makeUser(db, "administrator");
    const mailer = working();
    await retryNotification(db, admin, row.id, failed.id, mailer);
    await retryNotification(db, admin, row.id, failed.id, mailer);
    expect(mailer.send).toHaveBeenCalledTimes(1);
    const [sent] = await db.select().from(notificationAttempts);
    expect(sent.status).toBe("sent");
  });

  it("sends once when two workers run at the same time", async () => {
    await saved();
    const mailer = working();
    await Promise.all([processNotifications(db, mailer), processNotifications(db, mailer)]);
    expect(mailer.send).toHaveBeenCalledTimes(1);
  });

  it("backs off, then stops after five automatic attempts", async () => {
    await saved();
    const mailer = broken();
    const later = (minutes: number) => new Date(Date.now() + minutes * 60_000);
    await processNotifications(db, mailer);
    await processNotifications(db, mailer);
    expect(mailer.send).toHaveBeenCalledTimes(1);
    for (let i = 1; i <= 6; i++) await processNotifications(db, mailer, later(i * 100));
    expect(mailer.send).toHaveBeenCalledTimes(5);
  });

  it("keeps contact details out of the email body", async () => {
    await saved();
    const mailer = working();
    await processNotifications(db, mailer);
    const text = JSON.stringify(mailer.send.mock.calls[0][0]);
    expect(text).not.toContain("+251911234567");
    expect(text).not.toContain("Hana");
  });
});

describe("inbox", () => {
  it("records status, assignment and notes with an audit trail, and reopens (FR-039)", async () => {
    const row = await saved();
    const staff = await makeUser(db, "leasing_staff", "Selam");
    await assignEnquiry(db, staff, row.id, staff.id);
    await addEnquiryNote(db, staff, row.id, "Called, left a message");
    await setEnquiryStatus(db, staff, row.id, "closed");
    await setEnquiryStatus(db, staff, row.id, "contacted");

    const detail = await getEnquiryDetail(db, staff, row.id);
    expect(detail.enquiry.status).toBe("contacted");
    expect(detail.enquiry.assigneeId).toBe(staff.id);
    expect(detail.notes[0].body).toBe("Called, left a message");
    expect(detail.notes[0].author).toBe("Selam");
    const audit = await db.select().from(auditLog).where(eq(auditLog.entityId, row.id));
    expect(audit).toHaveLength(4);
    expect(audit.every((entry) => entry.actorId === staff.id)).toBe(true);
  });

  it("filters by status, unit and search text, treating wildcards literally (FR-038)", async () => {
    const { unit } = await publishedUnit(db);
    const row = await saved(unit.id);
    await saved();
    const admin = await makeUser(db, "administrator");
    expect(await listInbox(db, admin)).toHaveLength(2);
    expect(await listInbox(db, admin, { unitId: unit.id })).toHaveLength(1);
    expect(await listInbox(db, admin, { status: "closed" })).toHaveLength(0);
    expect(await listInbox(db, admin, { search: row.reference })).toHaveLength(1);
    expect(await listInbox(db, admin, { search: "ground floor" })).toHaveLength(1);
    expect(await listInbox(db, admin, { search: "%" })).toHaveLength(0);
  });

  it("filters dates by the Addis Ababa day", async () => {
    await saved();
    const admin = await makeUser(db, "administrator");
    expect(await listInbox(db, admin, { from: "2000-01-01", to: "2000-01-02" })).toHaveLength(0);
    expect(await listInbox(db, admin, { from: "2000-01-01" })).toHaveLength(1);
  });
});

describe("access boundaries (FR-042, UAT-11)", () => {
  it("denies content editors all lead access", async () => {
    const row = await saved();
    const editor = await makeUser(db, "content_editor");
    await expect(listInbox(db, editor)).rejects.toThrow(ForbiddenError);
    await expect(getEnquiryDetail(db, editor, row.id)).rejects.toThrow(ForbiddenError);
    await expect(setEnquiryStatus(db, editor, row.id, "spam")).rejects.toThrow(ForbiddenError);
    await expect(addEnquiryNote(db, editor, row.id, "x")).rejects.toThrow(ForbiddenError);
  });

  it("limits leasing staff to unassigned enquiries and their own", async () => {
    const row = await saved();
    const first = await makeUser(db, "leasing_staff");
    const second = await makeUser(db, "leasing_staff");
    await assignEnquiry(db, first, row.id, first.id);
    expect(await listInbox(db, second)).toHaveLength(0);
    await expect(getEnquiryDetail(db, second, row.id)).rejects.toThrow(ForbiddenError);
    await expect(setEnquiryStatus(db, second, row.id, "spam")).rejects.toThrow(ForbiddenError);
    expect(await listInbox(db, first)).toHaveLength(1);
  });

  it("will not assign an enquiry to a content editor", async () => {
    const row = await saved();
    const admin = await makeUser(db, "administrator");
    const editor = await makeUser(db, "content_editor");
    await expect(assignEnquiry(db, admin, row.id, editor.id)).rejects.toThrow(/cannot be assigned/);
  });
});

describe("rate limiting", () => {
  it("blocks after the limit and resets in the next window", async () => {
    const now = new Date("2026-11-05T10:00:00Z");
    expect(await hitRateLimit(db, "k", 2, 3600, now)).toBe(false);
    expect(await hitRateLimit(db, "k", 2, 3600, now)).toBe(false);
    expect(await hitRateLimit(db, "k", 2, 3600, now)).toBe(true);
    expect(await hitRateLimit(db, "k", 2, 3600, new Date("2026-11-05T11:00:00Z"))).toBe(false);
  });
});
