import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { dictionary, isLocale } from "@/i18n";
import { fontClasses } from "@/lib/fonts";
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
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const primary = ["cinema", "gym", "directory", "spaces", "visit"] as const;
  const secondary = ["about", "contact", "privacy"] as const;
  return (
    <html lang={locale} className={fontClasses}>
      <body>
        <a className="skip-link" href="#main">
          {t.skipToContent}
        </a>
        <header className="site-header">
          <div className="container">
            <Link className="site-brand" href={`/${locale}`}>
              {t.brand}
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
      </body>
    </html>
  );
}
