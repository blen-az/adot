import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/session";
import { getUnitForStaff, translationWarnings } from "@/server/units";

export default async function UnitPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { id } = await params;
  const locale = (await searchParams).locale === "am" ? "am" : "en";
  const user = await requireUser();
  const unit = await getUnitForStaff(await getDb(), user, id);
  if (!unit) notFound();
  const warnings = translationWarnings(unit);
  const src = `/admin/preview/${id}?locale=${locale}`;
  return (
    <>
      <h1>Preview: {unit.titleEn}</h1>
      <p className="actions">
        <Link href={`/admin/units/${id}`}>Back to editor</Link>
        <Link href={`?locale=${locale === "en" ? "am" : "en"}`}>Show {locale === "en" ? "Amharic" : "English"}</Link>
      </p>
      {locale === "am" && warnings.length > 0 && (
        <div className="alert warning">
          Missing translations will appear in English: {warnings.join(". ")}.
        </div>
      )}
      <div className="preview-frames">
        <iframe title="Mobile preview" src={src} width={390} />
        <iframe title="Desktop preview" src={src} width={1024} />
      </div>
    </>
  );
}
