"use client";

import { useActionState } from "react";
import { saveUnitAction, type UnitFormState } from "../../actions";

export function UnitForm({ id, initial }: { id?: string; initial: Record<string, string> }) {
  const start: UnitFormState = { errors: [], values: initial, saved: false };
  const [state, action, pending] = useActionState(saveUnitAction, start);
  const value = (key: string) => state.values[key] ?? "";

  const input = (key: string, label: string, props: React.ComponentProps<"input"> = {}) => (
    <div className="field">
      <label htmlFor={key}>{label}</label>
      <input id={key} name={key} defaultValue={value(key)} {...props} />
    </div>
  );
  const area = (key: string, label: string, hint?: string) => (
    <div className="field">
      <label htmlFor={key}>{label}</label>
      <textarea id={key} name={key} rows={4} defaultValue={value(key)} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );

  return (
    <form action={action} className="panel">
      {state.errors.length > 0 && (
        <div className="alert" role="alert">
          {state.errors.join(". ")}
        </div>
      )}
      {state.saved && (
        <p className="alert success" role="status">
          Saved.
        </p>
      )}
      {id && <input type="hidden" name="id" value={id} />}
      <div className="field-grid">
        {input("titleEn", "Title (English)")}
        {input("titleAm", "Title (Amharic)", { lang: "am" })}
        {input("reference", "Unit reference")}
        {input("floor", "Floor")}
        {input("category", "Category")}
        {input("areaM2", "Area (m²)", { type: "number", min: "0", step: "0.01" })}
      </div>
      <div className="field-grid">
        {area("descriptionEn", "Description (English)")}
        {area("descriptionAm", "Description (Amharic)")}
        {area("permittedUseEn", "Permitted use (English)")}
        {area("permittedUseAm", "Permitted use (Amharic)")}
        {area("featuresEn", "Features (English)", "One per line")}
        {area("featuresAm", "Features (Amharic)", "One per line")}
      </div>
      <div className="field-grid">
        {input("rentEtb", "Rent (ETB)", { type: "number", min: "0", step: "0.01" })}
        <div className="field">
          <label htmlFor="billingPeriod">Billing period</label>
          <select id="billingPeriod" name="billingPeriod" defaultValue={value("billingPeriod")}>
            <option value="">None</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        {input("serviceChargeEtb", "Service charge (ETB)", { type: "number", min: "0", step: "0.01" })}
        {input("availableFrom", "Available from", { type: "date" })}
      </div>
      <label className="check">
        <input type="checkbox" name="rentPublic" defaultChecked={value("rentPublic") === "on"} />
        <span>Show rent publicly. If this is off, visitors see “Contact for pricing”.</span>
      </label>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
