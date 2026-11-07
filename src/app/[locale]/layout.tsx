import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Ambient } from "@/components/Ambient";
import { AskAdot } from "@/components/AskAdot";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ScrollReveal } from "@/components/ScrollReveal";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { dictionary, isLocale } from "@/i18n";
import { fontClasses } from "@/lib/fonts";
import { getAssistantSettings } from "@/server/settings";
import "../globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const brand = isLocale(locale) ? dictionary(locale).brand : "Adot Complex";
  return { title: { default: brand, template: `%s | ${brand}` } };
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Pages reject an unknown locale themselves, so the 404 renders inside this shell.
  const requested = (await params).locale;
  const locale = isLocale(requested) ? requested : "en";
  const t = dictionary(locale);
  const assistant = await getAssistantSettings(await getDb());
  const primary = ["cinema", "gym", "directory", "visit"] as const;
  const secondary = ["about", "contact", "privacy"] as const;
  return (
    <html lang={locale} className={`dark ${fontClasses}`}>
      <body>
        <Ambient />
        <ScrollReveal />
        <a className="skip-link" href="#main">
          {t.skipToContent}
        </a>
        <header className="site-header">
          <div className="container">
            <Link className="site-brand" href={`/${locale}`}>
              <img src="/assets/logos/adot-wordmark.svg" alt={t.brand} width={127} height={40} />
            </Link>
            <nav aria-label={t.brand}>
              <ul className="site-nav">
                {primary.map((key) => (
                  <li key={key}>
                    <Link href={`/${locale}/${key}`}>{t.nav[key]}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Link className={buttonVariants()} data-cta href={`/${locale}/spaces`}>
              {t.nav.spaces}
            </Link>
            <Suspense>
              <LanguageSwitch locale={locale} />
            </Suspense>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="container">
            {secondary.map((key) => (
              <Link key={key} href={`/${locale}/${key}`}>
                {t.nav[key]}
              </Link>
            ))}
          </div>
        </footer>
        {assistant.enabled && <AskAdot locale={locale} />}
      </body>
    </html>
  );
}
