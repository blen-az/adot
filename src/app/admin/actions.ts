"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import type { Availability, EnquiryStatus } from "@/db/schema";
import { clientAddress } from "@/lib/request";
import { requireUser, SESSION_COOKIE } from "@/lib/session";
import { deleteConversation } from "@/server/assistant-log";
import { login, logout } from "@/server/auth";
import { addEnquiryNote, assignEnquiry, retryNotification, setEnquiryStatus } from "@/server/enquiries";
import { ValidationError } from "@/server/errors";
import { consoleMailer } from "@/server/mailer";
import { saveUpload } from "@/server/media";
import { hitRateLimit } from "@/server/rate-limit";
import { setListUnderDiscussion, setAssistantSettings } from "@/server/settings";
import { resetSiteImage, setSiteImage } from "@/server/site-images";
import {
  addMedia,
  archiveUnit,
  createUnit,
  moveMedia,
  publishUnit,
  removeMedia,
  restoreUnit,
  setAvailability,
  unpublishUnit,
  updateUnit,
  type UnitInput,
} from "@/server/units";

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

export async function loginAction(_previous: { error: string }, form: FormData) {
  const db = await getDb();
  const email = text(form, "email");
  if (await hitRateLimit(db, `login:${await clientAddress()}`, 10, 900)) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }
  const session = await login(db, email, text(form, "password"));
  if (!session) return { error: "Incorrect email or password." };
  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: session.expiresAt,
    path: "/",
  });
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await logout(await getDb(), token);
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function unitFromForm(form: FormData): UnitInput {
  return {
    reference: text(form, "reference"),
    floor: text(form, "floor"),
    category: text(form, "category"),
    areaM2: text(form, "areaM2"),
    titleEn: text(form, "titleEn"),
    titleAm: text(form, "titleAm"),
    descriptionEn: text(form, "descriptionEn"),
    descriptionAm: text(form, "descriptionAm"),
    permittedUseEn: text(form, "permittedUseEn"),
    permittedUseAm: text(form, "permittedUseAm"),
    featuresEn: lines(text(form, "featuresEn")),
    featuresAm: lines(text(form, "featuresAm")),
    rentEtb: text(form, "rentEtb"),
    billingPeriod: text(form, "billingPeriod"),
    serviceChargeEtb: text(form, "serviceChargeEtb"),
    rentPublic: form.get("rentPublic") === "on",
    availableFrom: text(form, "availableFrom"),
  };
}

export type UnitFormState = { errors: string[]; values: Record<string, string>; saved: boolean };

export async function saveUnitAction(_previous: UnitFormState, form: FormData): Promise<UnitFormState> {
  const user = await requireUser();
  const db = await getDb();
  const values = Object.fromEntries(
    [...form.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  const id = text(form, "id");
  try {
    if (id) {
      await updateUnit(db, user, id, unitFromForm(form));
      return { errors: [], values, saved: true };
    }
    const unit = await createUnit(db, user, unitFromForm(form));
    redirect(`/admin/units/${unit.id}`);
  } catch (error) {
    if (error instanceof ValidationError) return { errors: error.issues, values, saved: false };
    throw error;
  }
}

async function unitStep(id: string, step: () => Promise<unknown>) {
  try {
    await step();
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    redirect(`/admin/units/${id}?error=${encodeURIComponent(error.issues.join(". "))}`);
  }
  redirect(`/admin/units/${id}`);
}

export async function unitLifecycleAction(form: FormData) {
  const user = await requireUser();
  const db = await getDb();
  const id = text(form, "id");
  const steps = { publish: publishUnit, unpublish: unpublishUnit, archive: archiveUnit, restore: restoreUnit };
  const step = steps[text(form, "step") as keyof typeof steps];
  await unitStep(id, () => step(db, user, id));
}

export async function unitAvailabilityAction(form: FormData) {
  const user = await requireUser();
  const db = await getDb();
  const id = text(form, "id");
  await unitStep(id, () => setAvailability(db, user, id, text(form, "availability") as Availability));
}

export async function uploadMediaAction(form: FormData) {
  const user = await requireUser();
  const db = await getDb();
  const id = text(form, "id");
  await unitStep(id, async () => {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new ValidationError(["Choose an image to upload"]);
    if (!text(form, "altEn").trim()) throw new ValidationError(["English alternative text is required"]);
    const fileName = await saveUpload(Buffer.from(await file.arrayBuffer()));
    await addMedia(db, user, id, { fileName, altEn: text(form, "altEn").trim(), altAm: text(form, "altAm").trim() });
  });
}

export async function moveMediaAction(form: FormData) {
  const user = await requireUser();
  const db = await getDb();
  const id = text(form, "id");
  await unitStep(id, () => moveMedia(db, user, id, text(form, "mediaId"), text(form, "direction") === "up" ? -1 : 1));
}

export async function removeMediaAction(form: FormData) {
  const user = await requireUser();
  const db = await getDb();
  const id = text(form, "id");
  await unitStep(id, () => removeMedia(db, user, id, text(form, "mediaId")));
}

export async function enquiryStatusAction(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  await setEnquiryStatus(await getDb(), user, id, text(form, "status") as EnquiryStatus);
  redirect(`/admin/inbox/${id}`);
}

export async function enquiryAssignAction(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  await assignEnquiry(await getDb(), user, id, text(form, "assigneeId") || null);
  redirect(`/admin/inbox/${id}`);
}

export async function enquiryNoteAction(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  await addEnquiryNote(await getDb(), user, id, text(form, "body"));
  redirect(`/admin/inbox/${id}`);
}

export async function retryNotificationAction(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  await retryNotification(await getDb(), user, id, text(form, "attemptId"), consoleMailer);
  redirect(`/admin/inbox/${id}`);
}

export async function assistantSettingsAction(form: FormData) {
  const user = await requireUser();
  const dailyLimit = Math.max(0, Math.floor(Number(form.get("dailyLimit"))) || 0);
  await setAssistantSettings(await getDb(), user, {
    enabled: form.get("enabled") === "on",
    faqs: String(form.get("faqs") ?? "").slice(0, 8000),
    dailyLimit,
    retentionDays: Math.min(365, Math.max(1, Math.floor(Number(form.get("retentionDays"))) || 90)),
  });
  redirect("/admin/settings");
}

export async function deleteConversationAction(form: FormData) {
  const user = await requireUser();
  await deleteConversation(await getDb(), user, text(form, "id"));
  redirect("/admin/assistant");
}

export async function settingsAction(form: FormData) {
  const user = await requireUser();
  await setListUnderDiscussion(await getDb(), user, form.get("listUnderDiscussion") === "on");
  redirect("/admin/settings");
}

async function imagesStep(step: () => Promise<unknown>, done: string) {
  try {
    await step();
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    redirect(`/admin/images?error=${encodeURIComponent(error.issues.join(". "))}`);
  }
  redirect(`/admin/images?done=${encodeURIComponent(done)}`);
}

export async function uploadSiteImageAction(form: FormData) {
  const user = await requireUser();
  const db = await getDb();
  await imagesStep(async () => {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new ValidationError(["Choose an image to upload"]);
    if (!text(form, "altEn").trim()) throw new ValidationError(["English alternative text is required"]);
    const fileName = await saveUpload(Buffer.from(await file.arrayBuffer()));
    await setSiteImage(db, user, text(form, "slot"), { fileName, altEn: text(form, "altEn"), altAm: text(form, "altAm") });
  }, "Image replaced. It is live on the public site now.");
}

export async function resetSiteImageAction(form: FormData) {
  const user = await requireUser();
  const db = await getDb();
  await imagesStep(() => resetSiteImage(db, user, text(form, "slot")), "Image reset to the original photo.");
}
