import Link from "next/link";
import { dictionary, formatNumber, pick, type Locale } from "@/i18n";
import type { UnitWithMedia } from "@/server/units";
import { rentLabel } from "./rent";

export function UnitCard({ unit, locale }: { unit: UnitWithMedia; locale: Locale }) {
  const t = dictionary(locale);
  const title = pick(locale, unit.titleEn, unit.titleAm);
  const cover = unit.media[0];
  return (
    <li>
      <article className="unit-card">
        <Link href={`/${locale}/spaces/${unit.slug}`}>
          {cover && (
            <img src={`/media/${cover.fileName}`} alt={pick(locale, cover.altEn, cover.altAm).text} loading="lazy" />
          )}
          <div className="unit-card-body">
            <h3 lang={title.lang}>{title.text}</h3>
            <p className="meta">
              {t.spaces.floor} {unit.floor} · {formatNumber(locale, unit.areaM2 ?? 0)} m²
            </p>
            <p className="meta">{rentLabel(unit, locale)}</p>
            <span className="badge">{t.availability[unit.availability]}</span>
          </div>
        </Link>
      </article>
    </li>
  );
}
