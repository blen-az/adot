import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/EnquiryForm";
import { UnitDetail } from "@/components/UnitDetail";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { dictionary, isLocale, pick, type Locale } from "@/i18n";
import { getPublicUnit } from "@/server/units";

type Params = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getPublicUnit(await getDb(), slug);
  if (result.state !== "active") return { robots: { index: false } };
  return {
    title: pick(locale, result.unit.titleEn, result.unit.titleAm).text,
    description: pick(locale, result.unit.descriptionEn, result.unit.descriptionAm).text.slice(0, 160),
  };
}

export default async function UnitPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const result = await getPublicUnit(await getDb(), slug);
  if (result.state === "not_found") notFound();

  if (result.state === "unavailable") {
    return (
      <div className="container narrow">
        <h1>{t.spaces.unavailableHeading}</h1>
        <p>{t.spaces.unavailableBody}</p>
        <div className="actions">
          <Link className={buttonVariants()} href={`/${locale}/spaces`}>
            {t.spaces.browse}
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href={`/${locale}/enquire`}>
            {t.spaces.futureLink}
          </Link>
        </div>
      </div>
    );
  }

  const { unit } = result;
  return (
    <div className="container">
      <p>
        <Link href={`/${locale}/spaces`}>{t.spaces.back}</Link>
      </p>
      <UnitDetail unit={unit} locale={locale}>
        <a className={buttonVariants()} href="#enquiry">
          {t.spaces.enquire}
        </a>
      </UnitDetail>
      <section id="enquiry" className="narrow mt-6">
        <EnquiryForm
          locale={locale}
          idempotencyKey={randomUUID()}
          unit={{ id: unit.id, title: pick(locale, unit.titleEn, unit.titleAm).text, reference: unit.reference }}
        />
      </section>
    </div>
  );
}
