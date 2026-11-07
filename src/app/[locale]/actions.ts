"use server";

import { after } from "next/server";
import { getDb, type Db } from "@/db/client";
import { clientAddress } from "@/lib/request";
import { knownConversation } from "@/server/assistant-log";
import { processNotifications, submitEnquiry, type EnquiryInput, type EnquiryOrigin } from "@/server/enquiries";
import { consoleMailer } from "@/server/mailer";
import { hitRateLimit } from "@/server/rate-limit";

export type EnquiryFormState = {
  status: "idle" | "saved" | "invalid" | "unit_unavailable" | "rate_limited" | "failed";
  values: Record<string, string>;
  fields: string[];
  reference?: string;
  unitTitle?: string | null;
};

const ENQUIRIES_PER_HOUR = 10;

function notificationRecipients() {
  return (process.env.ENQUIRY_NOTIFY_TO ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

async function saveEnquiry(form: FormData, origin?: (db: Db) => Promise<EnquiryOrigin>): Promise<EnquiryFormState> {
  const values = Object.fromEntries(
    [...form.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  const retained = { values, fields: [] };

  // Bots fill the hidden field. They get a success screen, and nothing is saved.
  if (values.website) return { ...retained, status: "saved", reference: "ADT-RECEIVED", unitTitle: null };

  try {
    const db = await getDb();
    const address = await clientAddress();
    if (await hitRateLimit(db, `enquiry:${address}`, ENQUIRIES_PER_HOUR, 3600)) {
      return { ...retained, status: "rate_limited" };
    }
    const result = await submitEnquiry(
      db,
      { ...values, marketingConsent: values.marketingConsent === "on" } as EnquiryInput,
      notificationRecipients(),
      await origin?.(db),
    );
    if (result.status === "invalid") return { values, fields: result.fields, status: "invalid" };
    if (result.status === "unit_unavailable") return { ...retained, status: "unit_unavailable" };
    after(() => processNotifications(db, consoleMailer));
    return { ...retained, status: "saved", reference: result.reference, unitTitle: result.unitTitle };
  } catch (error) {
    console.error("Enquiry submission failed", error);
    return { ...retained, status: "failed" };
  }
}

export async function submitEnquiryAction(_previous: EnquiryFormState, form: FormData) {
  return saveEnquiry(form);
}

/** The short form inside Ask Adot. It becomes a normal inbox enquiry, linked to the chat. */
export async function submitLeadAction(_previous: EnquiryFormState, form: FormData) {
  form.set("type", "future_availability");
  form.set("unitId", "");
  form.set("message", String(form.get("intendedUse") ?? ""));
  const conversationId = form.get("conversationId");
  form.delete("conversationId");
  return saveEnquiry(form, async (db) => ({
    source: "assistant",
    assistantConversationId: await knownConversation(db, conversationId),
  }));
}
