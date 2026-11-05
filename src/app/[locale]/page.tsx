import Link from "next/link";
import { UnitCard } from "@/components/UnitCard";
import { getDb } from "@/db/client";
import { dictionary, type Locale } from "@/i18n";
import { listPublicUnits } from "@/server/units";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = dictionary(locale);
  const units = (await listPublicUnits(await getDb())).slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{t.home.heading}</h1>
          <p>{t.home.intro}</p>
          <div className="actions">
            <Link className="button gold" href={`/${locale}/spaces`}>
              {t.nav.spaces}
            </Link>
            <Link className="button secondary" href={`/${locale}/cinema`}>
              {t.nav.cinema}
            </Link>
            <Link className="button secondary" href={`/${locale}/gym`}>
              {t.nav.gym}
            </Link>
          </div>
        </div>
      </section>
      {units.length > 0 && (
        <section className="container">
          <h2>{t.home.featured}</h2>
          <ul className="card-grid">
            {units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} locale={locale} />
            ))}
          </ul>
          <p>
            <Link href={`/${locale}/spaces`}>{t.home.viewAll}</Link>
          </p>
        </section>
      )}
    </>
  );
}
