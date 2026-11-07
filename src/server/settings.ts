import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { settings } from "@/db/schema";
import { assertCan, type Actor } from "./permissions";

const LIST_UNDER_DISCUSSION = "list_under_discussion";
const ASSISTANT = "assistant";

export type AssistantSettings = { enabled: boolean; faqs: string; dailyLimit: number; retentionDays: number };
const assistantDefaults: AssistantSettings = { enabled: true, faqs: "", dailyLimit: 500, retentionDays: 90 };

export async function getListUnderDiscussion(db: Db) {
  const [row] = await db.select().from(settings).where(eq(settings.key, LIST_UNDER_DISCUSSION));
  return row?.value === true;
}

export async function setListUnderDiscussion(db: Db, actor: Actor, value: boolean) {
  assertCan(actor, "settings.manage");
  await db
    .insert(settings)
    .values({ key: LIST_UNDER_DISCUSSION, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function getAssistantSettings(db: Db): Promise<AssistantSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.key, ASSISTANT));
  return { ...assistantDefaults, ...(row?.value as Partial<AssistantSettings> | undefined) };
}

export async function setAssistantSettings(db: Db, actor: Actor, value: AssistantSettings) {
  assertCan(actor, "settings.manage");
  await db
    .insert(settings)
    .values({ key: ASSISTANT, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}
