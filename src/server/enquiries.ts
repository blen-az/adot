import { randomInt } from "node:crypto";
import { and, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import {
  auditLog,
  enquiries,
  enquiryNotes,
  notificationAttempts,
  units,
  users,
  type Enquiry,
  type EnquirySource,
  type EnquiryStatus,
} from "@/db/schema";
import { recordAudit } from "./audit";
import { ForbiddenError, ValidationError } from "./errors";
import type { Mailer } from "./mailer";
import { assertCan, can, type Actor } from "./permissions";
import { getListUnderDiscussion } from "./settings";
import { isEligible } from "./units";

export function normalisePhone(raw: string) {
  const compact = raw.replace(/[\s\-().]/g, "");
  if (/^0[79]\d{8}$/.test(compact)) return `+251${compact.slice(1)}`;
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  return null;
}

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export const enquiryInput = z.object({
  idempotencyKey: z.string().uuid("idempotencyKey"),
  type: z.enum(["unit", "future_availability"]),
  unitId: z.preprocess(blankToNull, z.string().nullable()),
  name: z.string().trim().min(1, "name").max(200, "name"),
  phone: z.string().transform((v, ctx) => {
    const phone = normalisePhone(v);
    if (!phone) ctx.addIssue({ code: "custom", message: "phone" });
    return phone ?? "";
  }),
  intendedUse: z.string().trim().min(1, "intendedUse").max(500, "intendedUse"),
  message: z.string().trim().min(1, "message").max(4000, "message"),
  email: z.preprocess(blankToNull, z.string().email("email").nullable()),
  company: z.preprocess(blankToNull, z.string().max(200, "company").nullable()),
  desiredArea: z.preprocess(blankToNull, z.string().max(200, "desiredArea").nullable()),
  contactMethod: z.preprocess(blankToNull, z.enum(["phone", "email", "whatsapp"]).nullable()),
  preferredDate: z.preprocess(blankToNull, z.string().date("preferredDate").nullable()),
  marketingConsent: z.boolean().default(false),
  locale: z.enum(["en", "am"]),
});

type OptionalEnquiryFields = "email" | "company" | "desiredArea" | "contactMethod" | "preferredDate";
type RawEnquiryInput = z.input<typeof enquiryInput>;
export type EnquiryInput = Omit<RawEnquiryInput, OptionalEnquiryFields> &
  Partial<Pick<RawEnquiryInput, OptionalEnquiryFields>>;

export type SubmitResult =
  | { status: "saved"; reference: string; unitTitle: string | null }
  | { status: "invalid"; fields: string[] }
  | { status: "unit_unavailable" };

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

function newReference(now: Date) {
  const suffix = Array.from({ length: 6 }, () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)]).join("");
  return `ADT-${now.getFullYear()}-${suffix}`;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function savedResult(enquiry: Enquiry): SubmitResult {
  return { status: "saved", reference: enquiry.reference, unitTitle: enquiry.unitSnapshot?.title ?? null };
}

/** Set by the server, never from form input, so a visitor cannot choose it. */
export type EnquiryOrigin = { source: EnquirySource; assistantConversationId: string | null };

export async function submitEnquiry(
  db: Db,
  input: EnquiryInput,
  recipients: string[],
  origin: EnquiryOrigin = { source: "website", assistantConversationId: null },
): Promise<SubmitResult> {
  const parsed = enquiryInput.safeParse(input);
  if (!parsed.success) return { status: "invalid", fields: [...new Set(parsed.error.issues.map((i) => i.message))] };
  const data = parsed.data;

  const [existing] = await db.select().from(enquiries).where(eq(enquiries.idempotencyKey, data.idempotencyKey));
  if (existing) return savedResult(existing);

  let snapshot: Enquiry["unitSnapshot"] = null;
  let unitId: string | null = null;
  if (data.type === "unit") {
    if (!data.unitId || !uuidPattern.test(data.unitId)) return { status: "unit_unavailable" };
    const [unit] = await db.select().from(units).where(eq(units.id, data.unitId));
    if (!unit || !isEligible(unit, await getListUnderDiscussion(db))) return { status: "unit_unavailable" };
    unitId = unit.id;
    snapshot = { title: unit.titleEn, reference: unit.reference, floor: unit.floor };
  }

  const inserted = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(enquiries)
      .values({ ...data, ...origin, unitId, unitSnapshot: snapshot, reference: newReference(new Date()) })
      .onConflictDoNothing({ target: enquiries.idempotencyKey })
      .returning();
    if (row && recipients.length) {
      await tx.insert(notificationAttempts).values(recipients.map((recipient) => ({ enquiryId: row.id, recipient })));
    }
    return row;
  });
  if (inserted) return savedResult(inserted);

  const [winner] = await db.select().from(enquiries).where(eq(enquiries.idempotencyKey, data.idempotencyKey));
  return savedResult(winner);
}

const MAX_ATTEMPTS = 5;

async function deliver(db: Db, mailer: Mailer, attemptId: string, now: Date) {
  const [claimed] = await db
    .update(notificationAttempts)
    .set({ status: "sending", attempts: sql`${notificationAttempts.attempts} + 1` })
    .where(and(eq(notificationAttempts.id, attemptId), inArray(notificationAttempts.status, ["pending", "failed"])))
    .returning();
  if (!claimed) return;
  const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, claimed.enquiryId));
  try {
    await mailer.send({
      to: claimed.recipient,
      subject: `New enquiry ${enquiry.reference}`,
      text: `${enquiry.reference}\n${enquiry.unitSnapshot?.title ?? enquiry.type}\nOpen the dashboard inbox to view contact details.`,
    });
    await db
      .update(notificationAttempts)
      .set({ status: "sent", sentAt: new Date(), lastError: null })
      .where(eq(notificationAttempts.id, attemptId));
  } catch (error) {
    await db
      .update(notificationAttempts)
      .set({
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
        nextAttemptAt: new Date(now.getTime() + 2 ** claimed.attempts * 60_000),
      })
      .where(eq(notificationAttempts.id, attemptId));
  }
}

export async function processNotifications(db: Db, mailer: Mailer, now = new Date()) {
  const due = await db
    .select({ id: notificationAttempts.id })
    .from(notificationAttempts)
    .where(
      and(
        inArray(notificationAttempts.status, ["pending", "failed"]),
        lte(notificationAttempts.nextAttemptAt, now),
        lte(notificationAttempts.attempts, MAX_ATTEMPTS - 1),
      ),
    );
  for (const { id } of due) await deliver(db, mailer, id, now);
}

function visibility(actor: Actor) {
  if (can(actor, "enquiries.readAll")) return undefined;
  return or(isNull(enquiries.assigneeId), eq(enquiries.assigneeId, actor.id));
}

export type InboxFilters = {
  status?: EnquiryStatus;
  unitId?: string;
  assigneeId?: string;
  source?: EnquirySource;
  from?: string;
  to?: string;
  search?: string;
};

export async function listInbox(db: Db, actor: Actor, filters: InboxFilters = {}) {
  assertCan(actor, "enquiries.read");
  const search = filters.search?.trim().replace(/[%_\\]/g, "\\$&");
  return db
    .select()
    .from(enquiries)
    .where(
      and(
        visibility(actor),
        filters.status ? eq(enquiries.status, filters.status) : undefined,
        filters.unitId ? eq(enquiries.unitId, filters.unitId) : undefined,
        filters.assigneeId ? eq(enquiries.assigneeId, filters.assigneeId) : undefined,
        filters.source ? eq(enquiries.source, filters.source) : undefined,
        filters.from ? gte(enquiries.createdAt, new Date(`${filters.from}T00:00:00+03:00`)) : undefined,
        filters.to ? lte(enquiries.createdAt, new Date(`${filters.to}T23:59:59.999+03:00`)) : undefined,
        search
          ? or(
              ilike(enquiries.reference, `%${search}%`),
              ilike(enquiries.name, `%${search}%`),
              ilike(enquiries.phone, `%${search}%`),
              sql`${enquiries.unitSnapshot}->>'title' ilike ${`%${search}%`}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(enquiries.createdAt))
    .limit(200);
}

async function requireVisible(db: Db, actor: Actor, id: string) {
  assertCan(actor, "enquiries.read");
  const [row] = await db
    .select()
    .from(enquiries)
    .where(and(eq(enquiries.id, id), visibility(actor)));
  if (!row) throw new ForbiddenError();
  return row;
}

export async function getEnquiryDetail(db: Db, actor: Actor, id: string) {
  const enquiry = await requireVisible(db, actor, id);
  const notes = await db
    .select({ id: enquiryNotes.id, body: enquiryNotes.body, createdAt: enquiryNotes.createdAt, author: users.name })
    .from(enquiryNotes)
    .leftJoin(users, eq(users.id, enquiryNotes.authorId))
    .where(eq(enquiryNotes.enquiryId, id))
    .orderBy(desc(enquiryNotes.createdAt));
  const notifications = await db.select().from(notificationAttempts).where(eq(notificationAttempts.enquiryId, id));
  const history = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      detail: auditLog.detail,
      createdAt: auditLog.createdAt,
      actor: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .where(and(eq(auditLog.entityType, "enquiry"), eq(auditLog.entityId, id)))
    .orderBy(desc(auditLog.createdAt));
  return { enquiry, notes, notifications, history };
}

export async function setEnquiryStatus(db: Db, actor: Actor, id: string, status: EnquiryStatus) {
  const before = await requireVisible(db, actor, id);
  await db.update(enquiries).set({ status, updatedAt: new Date() }).where(eq(enquiries.id, id));
  await recordAudit(db, {
    actorId: actor.id,
    action: "enquiry.status_changed",
    entityType: "enquiry",
    entityId: id,
    detail: { from: before.status, to: status },
  });
}

export async function listAssignees(db: Db, actor: Actor) {
  assertCan(actor, "enquiries.read");
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.active, true), inArray(users.role, ["administrator", "leasing_staff"])));
}

export async function assignEnquiry(db: Db, actor: Actor, id: string, assigneeId: string | null) {
  await requireVisible(db, actor, id);
  if (assigneeId && !(await listAssignees(db, actor)).some((u) => u.id === assigneeId)) {
    throw new ValidationError(["That person cannot be assigned enquiries"]);
  }
  await db.update(enquiries).set({ assigneeId, updatedAt: new Date() }).where(eq(enquiries.id, id));
  await recordAudit(db, {
    actorId: actor.id,
    action: "enquiry.assigned",
    entityType: "enquiry",
    entityId: id,
    detail: { assigneeId },
  });
}

export async function addEnquiryNote(db: Db, actor: Actor, id: string, body: string) {
  await requireVisible(db, actor, id);
  const text = body.trim();
  if (!text) throw new ValidationError(["Note cannot be empty"]);
  await db.insert(enquiryNotes).values({ enquiryId: id, authorId: actor.id, body: text });
  await recordAudit(db, { actorId: actor.id, action: "enquiry.note_added", entityType: "enquiry", entityId: id });
}

export async function retryNotification(db: Db, actor: Actor, enquiryId: string, attemptId: string, mailer: Mailer) {
  await requireVisible(db, actor, enquiryId);
  const [attempt] = await db
    .select({ id: notificationAttempts.id })
    .from(notificationAttempts)
    .where(and(eq(notificationAttempts.id, attemptId), eq(notificationAttempts.enquiryId, enquiryId)));
  if (attempt) await deliver(db, mailer, attempt.id, new Date());
}
