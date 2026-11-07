import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { auditLog, enquiries } from "@/db/schema";
import { checkAssistantGate } from "@/server/assistant";
import {
  assistantStats,
  deleteConversation,
  getConversation,
  knownConversation,
  listConversations,
  listUnanswered,
  recordExchange,
} from "@/server/assistant-log";
import { listInbox, submitEnquiry } from "@/server/enquiries";
import { setAssistantSettings } from "@/server/settings";
import { enquiry, makeUser, testDb } from "./helpers";

const DAY = 86_400_000;

let db: Db;
let admin: Awaited<ReturnType<typeof makeUser>>;

beforeEach(async () => {
  db = await testDb();
  admin = await makeUser(db, "administrator");
});

function exchange(overrides: Partial<Parameters<typeof recordExchange>[1]> = {}) {
  return {
    conversationId: randomUUID(),
    locale: "en",
    question: "What is available?",
    answer: "One unit.",
    outcome: "answered" as const,
    ...overrides,
  };
}

const lead = (conversationId: string | null) =>
  submitEnquiry(db, enquiry(null), [], { source: "assistant", assistantConversationId: conversationId });

describe("transcripts", () => {
  it("keeps a conversation's exchanges together and in order", async () => {
    const conversationId = randomUUID();
    await recordExchange(db, exchange({ conversationId, question: "First" }), new Date(1_000_000));
    await recordExchange(db, exchange({ conversationId, question: "Second" }), new Date(2_000_000));
    const detail = await getConversation(db, admin, conversationId);
    expect(detail?.exchanges.map((row) => row.question)).toEqual(["First", "Second"]);
    expect(detail?.conversation.lastMessageAt).toEqual(new Date(2_000_000));
  });

  it("deletes chats past the retention period, and keeps recent ones", async () => {
    await setAssistantSettings(db, admin, { enabled: true, faqs: "", dailyLimit: 5, retentionDays: 10 });
    const now = new Date();
    const old = exchange();
    const recent = exchange();
    await recordExchange(db, old, new Date(now.getTime() - 11 * DAY));
    await recordExchange(db, recent, new Date(now.getTime() - 9 * DAY));
    await recordExchange(db, exchange(), now);
    expect(await getConversation(db, admin, old.conversationId)).toBeNull();
    expect(await getConversation(db, admin, recent.conversationId)).not.toBeNull();
  });

  it("finds conversations by words and by outcome", async () => {
    const parking = exchange({ question: "Is there parking?", outcome: "unanswered" });
    const failed = exchange({ outcome: "failed", answer: "" });
    await recordExchange(db, parking);
    await recordExchange(db, failed);
    await recordExchange(db, exchange());
    expect(await listConversations(db, admin)).toHaveLength(3);
    expect((await listConversations(db, admin, { search: "PARKING" })).map((row) => row.id)).toEqual([parking.conversationId]);
    expect((await listConversations(db, admin, { show: "failed" })).map((row) => row.id)).toEqual([failed.conversationId]);
    expect((await listConversations(db, admin, { show: "unanswered" }))[0].firstQuestion).toBe("Is there parking?");
    expect((await listUnanswered(db, admin)).map((row) => row.question)).toEqual(["Is there parking?"]);
  });

  it("treats search wildcards as plain text", async () => {
    await recordExchange(db, exchange());
    expect(await listConversations(db, admin, { search: "%" })).toHaveLength(0);
  });

  it("records who deleted a conversation", async () => {
    const row = exchange();
    await recordExchange(db, row);
    await deleteConversation(db, admin, row.conversationId);
    expect(await getConversation(db, admin, row.conversationId)).toBeNull();
    const [entry] = await db.select().from(auditLog).where(eq(auditLog.entityId, row.conversationId));
    expect(entry.action).toBe("assistant.conversation_deleted");
    expect(entry.actorId).toBe(admin.id);
  });
});

describe("who can see chats", () => {
  it.each(["leasing_staff", "content_editor"] as const)("refuses %s", async (role) => {
    const staff = await makeUser(db, role);
    const row = exchange();
    await recordExchange(db, row);
    await expect(assistantStats(db, staff)).rejects.toThrow();
    await expect(listConversations(db, staff)).rejects.toThrow();
    await expect(listUnanswered(db, staff)).rejects.toThrow();
    await expect(getConversation(db, staff, row.conversationId)).rejects.toThrow();
    await expect(deleteConversation(db, staff, row.conversationId)).rejects.toThrow();
    expect(await getConversation(db, admin, row.conversationId)).not.toBeNull();
  });
});

describe("usage stats", () => {
  it("adds up outcomes, languages, leads and blocked visitors", async () => {
    const first = exchange();
    await recordExchange(db, first);
    await recordExchange(db, exchange({ conversationId: first.conversationId, outcome: "unanswered" }));
    await recordExchange(db, exchange({ locale: "am", outcome: "failed" }));
    await lead(first.conversationId);
    await submitEnquiry(db, enquiry(null), []);
    await setAssistantSettings(db, admin, { enabled: true, faqs: "", dailyLimit: 0, retentionDays: 90 });
    await checkAssistantGate(db, "1.1.1.1");

    const stats = await assistantStats(db, admin);
    expect(stats.totals).toEqual({ questions: 3, answered: 1, unanswered: 1, failed: 1 });
    expect(stats.conversations).toBe(2);
    expect(stats.byLocale).toEqual({ en: 1, am: 1 });
    expect(stats.leads).toBe(1);
    expect(stats.blocked).toBe(1);
  });

  it("groups days by Addis Ababa time and leaves out older activity", async () => {
    const now = new Date("2026-11-07T12:00:00Z");
    await recordExchange(db, exchange(), new Date("2026-11-06T22:00:00Z"));
    await recordExchange(db, exchange(), new Date(now.getTime() - 31 * DAY));
    const stats = await assistantStats(db, admin, now);
    expect(stats.days.map((day) => day.date)).toEqual(["2026-11-07"]);
    expect(stats.totals.questions).toBe(1);
  });
});

describe("leads from the chat", () => {
  it("reach the inbox, linked to the chat", async () => {
    const row = exchange();
    await recordExchange(db, row);
    await lead(row.conversationId);
    const [saved] = await listInbox(db, admin, { source: "assistant" });
    expect(saved.assistantConversationId).toBe(row.conversationId);
    expect((await getConversation(db, admin, row.conversationId))?.leads).toHaveLength(1);
    expect((await listConversations(db, admin, { show: "lead" }))[0].hasLead).toBe(true);
  });

  it("stay in the inbox when the chat is deleted", async () => {
    const row = exchange();
    await recordExchange(db, row);
    await lead(row.conversationId);
    await deleteConversation(db, admin, row.conversationId);
    const [saved] = await db.select().from(enquiries);
    expect(saved.source).toBe("assistant");
    expect(saved.assistantConversationId).toBeNull();
  });

  it("are saved even if the visitor never asked anything", async () => {
    expect(await knownConversation(db, randomUUID())).toBeNull();
    expect(await knownConversation(db, "not-a-uuid")).toBeNull();
    expect((await lead(null)).status).toBe("saved");
  });

  it("cannot be claimed through form fields", async () => {
    const row = exchange();
    await recordExchange(db, row);
    const forged = { ...enquiry(null), source: "assistant", assistantConversationId: row.conversationId };
    await submitEnquiry(db, forged, []);
    const [saved] = await db.select().from(enquiries);
    expect(saved.source).toBe("website");
    expect(saved.assistantConversationId).toBeNull();
  });
});
