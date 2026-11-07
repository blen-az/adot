import { and, asc, desc, eq, exists, gte, ilike, inArray, isNotNull, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import {
  assistantConversations,
  assistantExchanges,
  enquiries,
  rateLimits,
  type AssistantOutcome,
} from "@/db/schema";
import { recordAudit } from "./audit";
import { assertCan, type Actor } from "./permissions";
import { getAssistantSettings } from "./settings";

export const BLOCKED_KEY = "assistant:blocked";
const DAY_MS = 86_400_000;
const STATS_DAYS = 30;
const LIST_LIMIT = 100;
const UNANSWERED_LIMIT = 20;

export type ExchangeRecord = {
  conversationId: string;
  locale: string;
  question: string;
  answer: string;
  outcome: AssistantOutcome;
};

/** Saves one question and answer, and removes conversations past the retention period, so no scheduler is needed. */
export async function recordExchange(db: Db, exchange: ExchangeRecord, now = new Date()) {
  const { conversationId, locale, question, answer, outcome } = exchange;
  const { retentionDays } = await getAssistantSettings(db);
  await db.transaction(async (tx) => {
    await tx
      .insert(assistantConversations)
      .values({ id: conversationId, locale, startedAt: now, lastMessageAt: now })
      .onConflictDoUpdate({ target: assistantConversations.id, set: { lastMessageAt: now } });
    await tx.insert(assistantExchanges).values({ conversationId, question, answer, outcome, createdAt: now });
    await tx
      .delete(assistantConversations)
      .where(lt(assistantConversations.lastMessageAt, new Date(now.getTime() - retentionDays * DAY_MS)));
  });
}

/** A lead can arrive before any question, or after its conversation has expired, so the link is optional. */
export async function knownConversation(db: Db, id: unknown) {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return null;
  const [row] = await db
    .select({ id: assistantConversations.id })
    .from(assistantConversations)
    .where(eq(assistantConversations.id, parsed.data));
  return row?.id ?? null;
}

export async function assistantStats(db: Db, actor: Actor, now = new Date()) {
  assertCan(actor, "assistant.review");
  const since = new Date(now.getTime() - STATS_DAYS * DAY_MS);
  const day = sql<string>`to_char(${assistantExchanges.createdAt} at time zone 'Africa/Addis_Ababa', 'YYYY-MM-DD')`;

  const exchanges = await db
    .select({ day, outcome: assistantExchanges.outcome, count: sql<number>`count(*)::int` })
    .from(assistantExchanges)
    .where(gte(assistantExchanges.createdAt, since))
    .groupBy(day, assistantExchanges.outcome)
    .orderBy(desc(day));
  const conversations = await db
    .select({ locale: assistantConversations.locale, count: sql<number>`count(*)::int` })
    .from(assistantConversations)
    .where(gte(assistantConversations.startedAt, since))
    .groupBy(assistantConversations.locale);
  const [leads] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enquiries)
    .where(and(eq(enquiries.source, "assistant"), gte(enquiries.createdAt, since)));
  const [blocked] = await db
    .select({ count: sql<number>`coalesce(sum(${rateLimits.count}), 0)::int` })
    .from(rateLimits)
    .where(and(eq(rateLimits.key, BLOCKED_KEY), gte(rateLimits.windowStart, since)));

  const empty = { questions: 0, answered: 0, unanswered: 0, failed: 0 };
  const totals = { ...empty };
  const days = new Map<string, typeof empty>();
  for (const row of exchanges) {
    const entry = days.get(row.day) ?? { ...empty };
    days.set(row.day, entry);
    for (const target of [entry, totals]) {
      target.questions += row.count;
      target[row.outcome] += row.count;
    }
  }

  return {
    windowDays: STATS_DAYS,
    totals,
    days: [...days].map(([date, counts]) => ({ date, ...counts })),
    conversations: conversations.reduce((sum, row) => sum + row.count, 0),
    byLocale: Object.fromEntries(conversations.map((row) => [row.locale, row.count])),
    leads: leads.count,
    blocked: blocked.count,
  };
}

export async function listUnanswered(db: Db, actor: Actor) {
  assertCan(actor, "assistant.review");
  return db
    .select({
      id: assistantExchanges.id,
      conversationId: assistantExchanges.conversationId,
      question: assistantExchanges.question,
      createdAt: assistantExchanges.createdAt,
    })
    .from(assistantExchanges)
    .where(eq(assistantExchanges.outcome, "unanswered"))
    .orderBy(desc(assistantExchanges.createdAt))
    .limit(UNANSWERED_LIMIT);
}

export type ConversationFilters = { show?: "unanswered" | "failed" | "lead"; search?: string };

export async function listConversations(db: Db, actor: Actor, filters: ConversationFilters = {}) {
  assertCan(actor, "assistant.review");
  const belongs = eq(assistantExchanges.conversationId, assistantConversations.id);
  const withExchange = (condition: ReturnType<typeof and>) =>
    exists(db.select({ id: assistantExchanges.id }).from(assistantExchanges).where(and(belongs, condition)));
  const search = filters.search?.trim().replace(/[%_\\]/g, "\\$&");

  const conversations = await db
    .select()
    .from(assistantConversations)
    .where(
      and(
        filters.show === "unanswered" ? withExchange(eq(assistantExchanges.outcome, "unanswered")) : undefined,
        filters.show === "failed" ? withExchange(eq(assistantExchanges.outcome, "failed")) : undefined,
        filters.show === "lead"
          ? exists(
              db
                .select({ id: enquiries.id })
                .from(enquiries)
                .where(eq(enquiries.assistantConversationId, assistantConversations.id)),
            )
          : undefined,
        search
          ? withExchange(or(ilike(assistantExchanges.question, `%${search}%`), ilike(assistantExchanges.answer, `%${search}%`)))
          : undefined,
      ),
    )
    .orderBy(desc(assistantConversations.lastMessageAt))
    .limit(LIST_LIMIT);

  const ids = conversations.map((conversation) => conversation.id);
  if (ids.length === 0) return [];
  const exchanges = await db
    .select({
      conversationId: assistantExchanges.conversationId,
      question: assistantExchanges.question,
      outcome: assistantExchanges.outcome,
    })
    .from(assistantExchanges)
    .where(inArray(assistantExchanges.conversationId, ids))
    .orderBy(asc(assistantExchanges.createdAt));
  const leads = await db
    .select({ conversationId: enquiries.assistantConversationId })
    .from(enquiries)
    .where(and(isNotNull(enquiries.assistantConversationId), inArray(enquiries.assistantConversationId, ids)));

  return conversations.map((conversation) => {
    const own = exchanges.filter((exchange) => exchange.conversationId === conversation.id);
    return {
      ...conversation,
      firstQuestion: own[0]?.question ?? "",
      questions: own.length,
      unanswered: own.filter((exchange) => exchange.outcome === "unanswered").length,
      failed: own.filter((exchange) => exchange.outcome === "failed").length,
      hasLead: leads.some((lead) => lead.conversationId === conversation.id),
    };
  });
}

export async function getConversation(db: Db, actor: Actor, id: string) {
  assertCan(actor, "assistant.review");
  const [conversation] = await db.select().from(assistantConversations).where(eq(assistantConversations.id, id));
  if (!conversation) return null;
  const exchanges = await db
    .select()
    .from(assistantExchanges)
    .where(eq(assistantExchanges.conversationId, id))
    .orderBy(asc(assistantExchanges.createdAt));
  const leads = await db
    .select({ id: enquiries.id, reference: enquiries.reference })
    .from(enquiries)
    .where(eq(enquiries.assistantConversationId, id));
  return { conversation, exchanges, leads };
}

/** Removes the transcript. Any lead stays in the inbox, without its link to the chat. */
export async function deleteConversation(db: Db, actor: Actor, id: string) {
  assertCan(actor, "assistant.review");
  const [removed] = await db
    .delete(assistantConversations)
    .where(eq(assistantConversations.id, id))
    .returning({ id: assistantConversations.id });
  if (removed) {
    await recordAudit(db, {
      actorId: actor.id,
      action: "assistant.conversation_deleted",
      entityType: "assistant_conversation",
      entityId: id,
    });
  }
}
