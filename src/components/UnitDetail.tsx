import type { ReactNode } from "react";
import { dictionary, formatDate, formatNumber, pick, type Locale } from "@/i18n";
import type { UnitWithMedia } from "@/server/units";
import { rentLabel } from "./rent";

export function UnitDetail({ unit, locale, children }: { unit: UnitWithMedia; locale: Locale; children?: ReactNode }) {
  const t = dictionary(locale);
  const title = pick(locale, unit.titleEn, unit.titleAm);
  const description = pick(locale, unit.descriptionEn, unit.descriptionAm);
  const permittedUse = pick(locale, unit.permittedUseEn, unit.permittedUseAm);
  const useAmharicFeatures = locale === "am" && unit.featuresAm.length > 0;
  const features = useAmharicFeatures ? unit.featuresAm : unit.featuresEn;
  return (
    <>
      <h1 lang={title.lang}>{title.text}</h1>
      <div className="unit-detail">
        <div className="gallery">
          {unit.media.map((media) => (
            <img key={media.id} src={`/media/${media.fileName}`} alt={pick(locale, media.altEn, media.altAm).text} />
          ))}
        </div>
        <div>
          <dl className="facts">
            <dt>{t.spaces.status}</dt>
            <dd>{t.availability[unit.availability]}</dd>
            <dt>{t.spaces.reference}</dt>
            <dd>{unit.reference}</dd>
            <dt>{t.spaces.floor}</dt>
            <dd>{unit.floor}</dd>
            <dt>{t.spaces.category}</dt>
            <dd>{unit.category}</dd>
            {unit.areaM2 && (
              <>
                <dt>{t.spaces.area}</dt>
                <dd>{formatNumber(locale, unit.areaM2)} m²</dd>
              </>
            )}
            <dt>{t.spaces.rent}</dt>
            <dd>{rentLabel(unit, locale)}</dd>
            {unit.rentPublic && unit.serviceChargeEtb && (
              <>
                <dt>{t.spaces.serviceCharge}</dt>
                <dd>ETB {formatNumber(locale, unit.serviceChargeEtb)}</dd>
              </>
            )}
            {unit.availableFrom && (
              <>
                <dt>{t.spaces.availableFrom}</dt>
                <dd>{formatDate(locale, unit.availableFrom)}</dd>
              </>
            )}
          </dl>
          <p lang={description.lang}>{description.text}</p>
          {permittedUse.text && (
            <>
              <h2>{t.spaces.permittedUse}</h2>
              <p lang={permittedUse.lang}>{permittedUse.text}</p>
            </>
          )}
          {features.length > 0 && (
            <>
              <h2>{t.spaces.features}</h2>
              <ul lang={useAmharicFeatures ? "am" : "en"}>
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
