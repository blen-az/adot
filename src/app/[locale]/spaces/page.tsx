import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryForm } from "@/components/EnquiryForm";
import { UnitCard } from "@/components/UnitCard";
import { getDb } from "@/db/client";
import { dictionary, type Locale } from "@/i18n";
import { listPublicUnits, publicFilterOptions } from "@/server/units";

type Search = { floor?: string; category?: string; minArea?: string; maxArea?: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: dictionary(locale).spaces.heading };
}

function positive(value?: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

export default async function SpacesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  const t = dictionary(locale);
  const db = await getDb();
  const filters = {
    floor: search.floor || undefined,
    category: search.category || undefined,
    minArea: positive(search.minArea),
    maxArea: positive(search.maxArea),
  };
  const filtered = Object.values(filters).some(Boolean);
  const [units, options] = [await listPublicUnits(db, filters), await publicFilterOptions(db)];
  const inventoryEmpty = options.floors.length === 0;

  return (
    <div className="container">
      <h1>{t.spaces.heading}</h1>
      <p>{t.spaces.intro}</p>

      {inventoryEmpty ? (
        <div className="narrow">
          <h2>{t.spaces.noUnitsHeading}</h2>
          <p>{t.spaces.noUnitsBody}</p>
          <EnquiryForm locale={locale} idempotencyKey={randomUUID()} />
        </div>
      ) : (
        <>
          <form className="filters" method="get">
            <div className="field">
              <label htmlFor="floor">{t.spaces.floor}</label>
              <select id="floor" name="floor" defaultValue={search.floor ?? ""}>
                <option value="">{t.spaces.any}</option>
                {options.floors.map((floor) => (
                  <option key={floor}>{floor}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="category">{t.spaces.category}</label>
              <select id="category" name="category" defaultValue={search.category ?? ""}>
                <option value="">{t.spaces.any}</option>
                {options.categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="minArea">{t.spaces.minArea}</label>
              <input id="minArea" name="minArea" type="number" min="0" defaultValue={search.minArea} />
            </div>
            <div className="field">
              <label htmlFor="maxArea">{t.spaces.maxArea}</label>
              <input id="maxArea" name="maxArea" type="number" min="0" defaultValue={search.maxArea} />
            </div>
            <div className="actions">
              <button className="button" type="submit">
                {t.spaces.apply}
              </button>
              {filtered && <Link href={`/${locale}/spaces`}>{t.spaces.clear}</Link>}
            </div>
          </form>

          {units.length > 0 ? (
            <ul className="card-grid">
              {units.map((unit) => (
                <UnitCard key={unit.id} unit={unit} locale={locale} />
              ))}
            </ul>
          ) : (
            <div className="panel">
              <h2>{t.spaces.noMatchHeading}</h2>
              <p>{t.spaces.noMatchBody}</p>
              <Link className="button" href={`/${locale}/enquire`}>
                {t.spaces.futureLink}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
