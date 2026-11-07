import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/EnquiryForm";
import { dictionary, isLocale, type Locale } from "@/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: dictionary(locale).form.futureHeading };
}

export default async function EnquirePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="container narrow">
      <EnquiryForm locale={locale} idempotencyKey={randomUUID()} />
    </div>
  );
}
