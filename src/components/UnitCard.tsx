import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { dictionary, formatNumber, pick, type Locale } from "@/i18n";
import type { UnitWithMedia } from "@/server/units";
import { rentLabel } from "./rent";

export function UnitCard({ unit, locale }: { unit: UnitWithMedia; locale: Locale }) {
  const t = dictionary(locale);
  const title = pick(locale, unit.titleEn, unit.titleAm);
  const cover = unit.media[0];
  return (
    <li>
      <Link className="block h-full text-foreground no-underline" href={`/${locale}/spaces/${unit.slug}`}>
        <Card className="h-full transition-all duration-300 hover:ring-foreground/20">
          {cover && (
            <img
              className="aspect-4/3 w-full object-cover"
              src={`/media/${cover.fileName}`}
              alt={pick(locale, cover.altEn, cover.altAm).text}
              loading="lazy"
            />
          )}
          <CardContent className="flex flex-1 flex-col items-start gap-1">
            <CardTitle>
              <h3 className="mb-1 text-xl" lang={title.lang}>
                {title.text}
              </h3>
            </CardTitle>
            <p className="meta">
              {t.spaces.floor}: {unit.floor} · {formatNumber(locale, unit.areaM2 ?? 0)} m²
            </p>
            <p className="meta mb-3">{rentLabel(unit, locale)}</p>
            <Badge className="mt-auto" variant="outline">
              {t.availability[unit.availability]}
            </Badge>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}
