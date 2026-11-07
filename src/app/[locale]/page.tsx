import { notFound } from "next/navigation";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { UnitCard } from "@/components/UnitCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { dictionary, isLocale, type Locale } from "@/i18n";
import { listPublicUnits } from "@/server/units";

const destinations = [
  { key: "cinema", image: "cinema-auditorium-angled-card.webp" },
  { key: "gym", image: "adot-gymnasium-interior-card.webp" },
  { key: "directory", image: "adot-multiplex-exterior-card.webp" },
  { key: "visit", image: "adot-building-facade-card.webp" },
] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const units = (await listPublicUnits(await getDb())).slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="container">
          <Badge className="h-8 border-input px-4 text-sm" variant="outline">
            <SparklesIcon className="animate-pulse text-primary" data-icon="inline-start" />
            {t.brand}
          </Badge>
          <h1>
            <span>{t.home.headingLead}</span> <span className="text-gradient">{t.home.headingAccent}</span>
          </h1>
          <p>{t.home.intro}</p>
          <div className="actions">
            <Link className={buttonVariants({ size: "lg" })} href={`/${locale}/spaces`}>
              {t.nav.spaces}
              <ArrowRightIcon className="transition-transform group-hover/button:translate-x-1" data-icon="inline-end" />
            </Link>
            <Link className={buttonVariants({ size: "lg", variant: "outline" })} href={`/${locale}/cinema`}>
              {t.nav.cinema}
            </Link>
            <Link className={buttonVariants({ size: "lg", variant: "outline" })} href={`/${locale}/gym`}>
              {t.nav.gym}
            </Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <ul className="card-grid grid-cols-2 lg:grid-cols-4">
          {destinations.map(({ key, image }) => (
            <li key={key}>
              <Link className="block h-full text-foreground no-underline" href={`/${locale}/${key}`}>
                <Card className="h-full transition-all duration-300 hover:ring-foreground/20">
                  <img className="aspect-4/3 w-full object-cover" src={`/assets/images/${image}`} alt="" loading="lazy" />
                  <CardContent>
                    <CardTitle className="text-lg">{t.nav[key]}</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {units.length > 0 && (
        <section className="container section">
          <h2>{t.home.featured}</h2>
          <ul className="unit-grid">
            {units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} locale={locale} />
            ))}
          </ul>
          <div className="actions mt-5 justify-center">
            <Link className={buttonVariants({ variant: "outline" })} href={`/${locale}/spaces`}>
              {t.home.viewAll}
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
