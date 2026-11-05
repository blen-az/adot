import { notFound } from "next/navigation";
import { UnitDetail } from "@/components/UnitDetail";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/session";
import { getUnitForStaff } from "@/server/units";

export default async function PreviewFrame({
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
  return (
    <main className="container" lang={locale}>
      <UnitDetail unit={unit} locale={locale} />
    </main>
  );
}
