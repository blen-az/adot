import type { Unit } from "@/db/schema";
import { dictionary, formatNumber, type Locale } from "@/i18n";

export function rentLabel(unit: Unit, locale: Locale) {
  const t = dictionary(locale);
  if (!unit.rentPublic || !unit.rentEtb || !unit.billingPeriod) return t.spaces.contactForPricing;
  return `ETB ${formatNumber(locale, unit.rentEtb)} ${t.billing[unit.billingPeriod]}`;
}
