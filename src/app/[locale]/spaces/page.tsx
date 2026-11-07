import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryForm } from "@/components/EnquiryForm";
import { UnitCard } from "@/components/UnitCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { getDb } from "@/db/client";
import { dictionary, isLocale, type Locale } from "@/i18n";
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
  if (!isLocale(locale)) notFound();
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
      <div className="page-head">
        <h1>{t.spaces.heading}</h1>
        <p>{t.spaces.intro}</p>
      </div>

      {inventoryEmpty ? (
        <div className="narrow">
          <h2>{t.spaces.noUnitsHeading}</h2>
          <p>{t.spaces.noUnitsBody}</p>
          <EnquiryForm locale={locale} idempotencyKey={randomUUID()} />
        </div>
      ) : (
        <>
          <Card className="mt-3 mb-5">
            <CardContent>
              <form className="filters" method="get">
                <Field>
                  <FieldLabel htmlFor="floor">{t.spaces.floor}</FieldLabel>
                  <NativeSelect id="floor" name="floor" defaultValue={search.floor ?? ""}>
                    <NativeSelectOption value="">{t.spaces.any}</NativeSelectOption>
                    {options.floors.map((floor) => (
                      <NativeSelectOption key={floor}>{floor}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="category">{t.spaces.category}</FieldLabel>
                  <NativeSelect id="category" name="category" defaultValue={search.category ?? ""}>
                    <NativeSelectOption value="">{t.spaces.any}</NativeSelectOption>
                    {options.categories.map((category) => (
                      <NativeSelectOption key={category}>{category}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="minArea">{t.spaces.minArea}</FieldLabel>
                  <Input id="minArea" name="minArea" type="number" min="0" defaultValue={search.minArea} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="maxArea">{t.spaces.maxArea}</FieldLabel>
                  <Input id="maxArea" name="maxArea" type="number" min="0" defaultValue={search.maxArea} />
                </Field>
                <div className="actions">
                  <Button type="submit">{t.spaces.apply}</Button>
                  {filtered && <Link href={`/${locale}/spaces`}>{t.spaces.clear}</Link>}
                </div>
              </form>
            </CardContent>
          </Card>

          {units.length > 0 ? (
            <ul className="unit-grid">
              {units.map((unit) => (
                <UnitCard key={unit.id} unit={unit} locale={locale} />
              ))}
            </ul>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2 className="mb-0">{t.spaces.noMatchHeading}</h2>
                </CardTitle>
                <CardDescription>{t.spaces.noMatchBody}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link className={buttonVariants()} href={`/${locale}/enquire`}>
                  {t.spaces.futureLink}
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
