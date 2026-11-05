"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitEnquiryAction, type EnquiryFormState } from "@/app/[locale]/actions";
import { dictionary, type Locale } from "@/i18n";

type Props = {
  locale: Locale;
  idempotencyKey: string;
  unit?: { id: string; title: string; reference: string };
};

const initialState: EnquiryFormState = { status: "idle", values: {}, fields: [] };

export function EnquiryForm({ locale, idempotencyKey, unit }: Props) {
  const t = dictionary(locale).form;
  const [state, action, pending] = useActionState(submitEnquiryAction, initialState);
  const [switched, setSwitched] = useState(false);
  const unitMode = Boolean(unit) && !switched;

  if (state.status === "saved") {
    return (
      <div className="alert success" role="status">
        <h2>{t.successHeading}</h2>
        <p>
          {t.successReference}: <span className="reference">{state.reference}</span>
        </p>
        {state.unitTitle && (
          <p>
            {t.successUnit}: {state.unitTitle}
          </p>
        )}
        <p>{t.successNext}</p>
      </div>
    );
  }

  const invalid = (field: string) => state.fields.includes(field);
  const fieldProps = (field: keyof typeof t.errors) => ({
    id: field,
    name: field,
    defaultValue: state.values[field] ?? "",
    "aria-invalid": invalid(field) || undefined,
    "aria-describedby": invalid(field) ? `${field}-error` : undefined,
  });
  const fieldError = (field: keyof typeof t.errors) =>
    invalid(field) && (
      <span className="field-error" id={`${field}-error`}>
        {t.errors[field]}
      </span>
    );
  const optional = <span className="hint">({t.optional})</span>;

  return (
    <form action={action} className="panel" noValidate>
      <h2>{unitMode ? t.unitHeading : t.futureHeading}</h2>
      {unitMode && unit ? (
        <p>
          {t.enquiringAbout}: <strong>{unit.title}</strong> ({unit.reference})
        </p>
      ) : (
        <p>{t.futureIntro}</p>
      )}

      {state.status === "unit_unavailable" && !switched && (
        <div className="alert warning" role="alert">
          <strong>{t.staleHeading}</strong>
          <p>{t.staleBody}</p>
          <button type="button" className="button small" onClick={() => setSwitched(true)}>
            {t.staleSwitch}
          </button>
        </div>
      )}
      {state.status === "invalid" && (
        <p className="alert" role="alert">
          {t.errorSummary}
        </p>
      )}
      {state.status === "failed" && (
        <p className="alert" role="alert">
          {t.failed}
        </p>
      )}
      {state.status === "rate_limited" && (
        <p className="alert" role="alert">
          {t.rateLimited}
        </p>
      )}

      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="type" value={unitMode ? "unit" : "future_availability"} />
      {unitMode && unit && <input type="hidden" name="unitId" value={unit.id} />}

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="name">{t.name}</label>
          <input {...fieldProps("name")} autoComplete="name" required />
          {fieldError("name")}
        </div>
        <div className="field">
          <label htmlFor="phone">{t.phone}</label>
          <input {...fieldProps("phone")} type="tel" autoComplete="tel" required />
          <span className="hint">{t.phoneHint}</span>
          {fieldError("phone")}
        </div>
      </div>
      <div className="field">
        <label htmlFor="intendedUse">{t.intendedUse}</label>
        <input {...fieldProps("intendedUse")} required />
        {fieldError("intendedUse")}
      </div>
      <div className="field">
        <label htmlFor="message">{t.message}</label>
        <textarea {...fieldProps("message")} rows={4} required />
        {fieldError("message")}
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="email">
            {t.email} {optional}
          </label>
          <input {...fieldProps("email")} type="email" autoComplete="email" />
          {fieldError("email")}
        </div>
        <div className="field">
          <label htmlFor="company">
            {t.company} {optional}
          </label>
          <input {...fieldProps("company")} autoComplete="organization" />
          {fieldError("company")}
        </div>
        {unitMode ? (
          <div className="field">
            <label htmlFor="preferredDate">
              {t.preferredDate} {optional}
            </label>
            <input {...fieldProps("preferredDate")} type="date" />
            <span className="hint">{t.preferredDateHint}</span>
            {fieldError("preferredDate")}
          </div>
        ) : (
          <div className="field">
            <label htmlFor="desiredArea">
              {t.desiredArea} {optional}
            </label>
            <input {...fieldProps("desiredArea")} />
            {fieldError("desiredArea")}
          </div>
        )}
        <div className="field">
          <label htmlFor="contactMethod">
            {t.contactMethod} {optional}
          </label>
          <select id="contactMethod" name="contactMethod" defaultValue={state.values.contactMethod ?? ""}>
            <option value="">{t.noPreference}</option>
            <option value="phone">{t.methods.phone}</option>
            <option value="email">{t.methods.email}</option>
            <option value="whatsapp">{t.methods.whatsapp}</option>
          </select>
        </div>
      </div>

      <p className="hint">
        {t.notice} <Link href={`/${locale}/privacy`}>{t.privacyLink}</Link>
      </p>
      <label className="check">
        <input type="checkbox" name="marketingConsent" defaultChecked={state.values.marketingConsent === "on"} />
        <span>
          {t.marketing} {optional}
        </span>
      </label>

      <button className="button" type="submit" disabled={pending}>
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
