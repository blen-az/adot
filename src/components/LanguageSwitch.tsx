"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { dictionary, type Locale } from "@/i18n";

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const other: Locale = locale === "en" ? "am" : "en";
  const href = pathname.replace(/^\/(en|am)/, `/${other}`) + (query ? `?${query}` : "");
  return (
    <Link className="language-switch" href={href} hrefLang={other} lang={other}>
      {dictionary(locale).otherLanguage}
    </Link>
  );
}
