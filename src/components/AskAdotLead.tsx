"use client";

import { useActionState, useState } from "react";
import { submitLeadAction, type EnquiryFormState } from "@/app/[locale]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dictionary, type Locale } from "@/i18n";
import { newId } from "@/lib/id";

const initialState: EnquiryFormState = { status: "idle", values: {}, fields: [] };

/** Posts straight to the server, so contact details never reach the AI model. */
export function AskAdotLead({ locale, conversationId, onClose }: { locale: Locale; conversationId: string; onClose: () => void }) {
  const t = dictionary(locale).assistant;
  const [state, action, pending] = useActionState(submitLeadAction, initialState);
  const [idempotencyKey] = useState(newId);

  if (state.status === "saved") {
    return (
      <div className="flex flex-col gap-2 border-t border-border p-3 text-sm" role="status">
        <p className="my-0">
          {t.leadSaved} <span className="reference">{state.reference}</span>
        </p>
        <Button size="sm" variant="outline" onClick={onClose}>
          {t.leadCancel}
        </Button>
      </div>
    );
  }

  const problem = state.status === "invalid" ? t.leadInvalid : state.status === "idle" ? null : t.leadFailed;
  return (
    <form className="flex flex-col gap-2 border-t border-border p-3" action={action}>
      <p className="my-0 text-xs text-muted-foreground">{t.leadIntro}</p>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="locale" value={locale} />
      <input className="sr-only" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <Input name="name" aria-label={t.leadName} placeholder={t.leadName} defaultValue={state.values.name} maxLength={200} required autoComplete="name" />
      <Input name="phone" type="tel" aria-label={t.leadPhone} placeholder={t.leadPhone} defaultValue={state.values.phone} required autoComplete="tel" />
      <Input name="intendedUse" aria-label={t.leadNeed} placeholder={t.leadNeed} defaultValue={state.values.intendedUse} maxLength={500} required />
      {problem && (
        <p className="my-0 text-xs text-destructive" role="alert">
          {problem}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={pending}>
          {t.leadSend}
        </Button>
        <Button size="sm" type="button" variant="ghost" onClick={onClose}>
          {t.leadCancel}
        </Button>
      </div>
    </form>
  );
}
