"use client";

import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { submitEnquiryAction, type EnquiryFormState } from "@/app/[locale]/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
      <Alert role="status">
        <CircleCheckIcon />
        <AlertTitle>
          <h2 className="mb-1">{t.successHeading}</h2>
        </AlertTitle>
        <AlertDescription>
          <p>
            {t.successReference}: <span className="reference">{state.reference}</span>
          </p>
          {state.unitTitle && (
            <p>
              {t.successUnit}: {state.unitTitle}
            </p>
          )}
          <p>{t.successNext}</p>
        </AlertDescription>
      </Alert>
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
    invalid(field) && <FieldError id={`${field}-error`}>{t.errors[field]}</FieldError>;
  const optional = <span className="font-normal text-muted-foreground">({t.optional})</span>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="mb-0">{unitMode ? t.unitHeading : t.futureHeading}</h2>
        </CardTitle>
        <CardDescription>
          {unitMode && unit ? (
            <>
              {t.enquiringAbout}: <strong>{unit.title}</strong> ({unit.reference})
            </>
          ) : (
            t.futureIntro
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.status === "unit_unavailable" && !switched && (
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>{t.staleHeading}</AlertTitle>
          <AlertDescription>
            <p>{t.staleBody}</p>
            <Button type="button" size="sm" onClick={() => setSwitched(true)}>
              {t.staleSwitch}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {state.status === "invalid" && (
        <Alert variant="destructive">
          <AlertDescription>{t.errorSummary}</AlertDescription>
        </Alert>
      )}
      {state.status === "failed" && (
        <Alert variant="destructive">
          <AlertDescription>{t.failed}</AlertDescription>
        </Alert>
      )}
      {state.status === "rate_limited" && (
        <Alert variant="destructive">
          <AlertDescription>{t.rateLimited}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="type" value={unitMode ? "unit" : "future_availability"} />
      {unitMode && unit && <input type="hidden" name="unitId" value={unit.id} />}

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <FieldGroup className="gap-4">
      <div className="field-grid">
        <Field data-invalid={invalid("name") || undefined}>
          <FieldLabel htmlFor="name">{t.name}</FieldLabel>
          <Input {...fieldProps("name")} autoComplete="name" required />
          {fieldError("name")}
        </Field>
        <Field data-invalid={invalid("phone") || undefined}>
          <FieldLabel htmlFor="phone">{t.phone}</FieldLabel>
          <Input {...fieldProps("phone")} type="tel" autoComplete="tel" required />
          <FieldDescription>{t.phoneHint}</FieldDescription>
          {fieldError("phone")}
        </Field>
      </div>
      <Field data-invalid={invalid("intendedUse") || undefined}>
        <FieldLabel htmlFor="intendedUse">{t.intendedUse}</FieldLabel>
        <Input {...fieldProps("intendedUse")} required />
          {fieldError("intendedUse")}
        </Field>
      <Field data-invalid={invalid("message") || undefined}>
        <FieldLabel htmlFor="message">{t.message}</FieldLabel>
        <Textarea {...fieldProps("message")} rows={4} required />
          {fieldError("message")}
        </Field>
      <div className="field-grid">
        <Field data-invalid={invalid("email") || undefined}>
          <FieldLabel htmlFor="email">
            {t.email} {optional}
          </FieldLabel>
          <Input {...fieldProps("email")} type="email" autoComplete="email" />
          {fieldError("email")}
        </Field>
        <Field data-invalid={invalid("company") || undefined}>
          <FieldLabel htmlFor="company">
            {t.company} {optional}
          </FieldLabel>
          <Input {...fieldProps("company")} autoComplete="organization" />
          {fieldError("company")}
        </Field>
        {unitMode ? (
          <Field data-invalid={invalid("preferredDate") || undefined}>
            <FieldLabel htmlFor="preferredDate">
              {t.preferredDate} {optional}
            </FieldLabel>
            <Input {...fieldProps("preferredDate")} type="date" />
            <FieldDescription>{t.preferredDateHint}</FieldDescription>
          {fieldError("preferredDate")}
        </Field>
        ) : (
          <Field data-invalid={invalid("desiredArea") || undefined}>
            <FieldLabel htmlFor="desiredArea">
              {t.desiredArea} {optional}
            </FieldLabel>
            <Input {...fieldProps("desiredArea")} />
          {fieldError("desiredArea")}
        </Field>
        )}
        <Field>
          <FieldLabel htmlFor="contactMethod">
            {t.contactMethod} {optional}
          </FieldLabel>
          <NativeSelect id="contactMethod" name="contactMethod" defaultValue={state.values.contactMethod ?? ""}>
            <NativeSelectOption value="">{t.noPreference}</NativeSelectOption>
            <NativeSelectOption value="phone">{t.methods.phone}</NativeSelectOption>
            <NativeSelectOption value="email">{t.methods.email}</NativeSelectOption>
            <NativeSelectOption value="whatsapp">{t.methods.whatsapp}</NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>
      </FieldGroup>

      <p className="hint my-0">
        {t.notice} <Link href={`/${locale}/privacy`}>{t.privacyLink}</Link>
      </p>
      <Field orientation="horizontal">
        <Checkbox
          id="marketingConsent"
          name="marketingConsent"
          defaultChecked={state.values.marketingConsent === "on"}
        />
        <FieldLabel className="font-normal" htmlFor="marketingConsent">
          <span>
            {t.marketing} {optional}
          </span>
        </FieldLabel>
      </Field>

      <Button className="self-start" type="submit" disabled={pending}>
        {pending ? t.sending : t.submit}
      </Button>
    </form>
      </CardContent>
    </Card>
  );
}
