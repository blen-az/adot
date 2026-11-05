"use server";

import { after } from "next/server";
import { getDb } from "@/db/client";
import { clientAddress } from "@/lib/request";
import { processNotifications, submitEnquiry, type EnquiryInput } from "@/server/enquiries";
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

export async function submitEnquiryAction(_previous: EnquiryFormState, form: FormData): Promise<EnquiryFormState> {
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
