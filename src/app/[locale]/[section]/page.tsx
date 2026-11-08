import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { dictionary, isLocale, type Locale } from "@/i18n";
import { getSiteImages, type SiteImageSlot } from "@/server/site-images";

const sections = ["cinema", "gym", "directory", "visit", "about", "contact", "privacy"] as const;
type Section = (typeof sections)[number];
// Photos are site-image slots, so staff can replace them from the dashboard (Site images).
const media: Partial<
  Record<Section, { logo?: { src: string; alt: string; width: number; height: number }; photos: SiteImageSlot[] }>
> = {
  cinema: {
    logo: { src: "adot-cinema-horizontal.svg", alt: "Adot Cinema Theater", width: 383, height: 100 },
    photos: ["auditoriumFront", "auditoriumAngled"],
  },
  gym: {
    logo: {
      src: "adot-gymnasium-horizontal-light.svg",
      alt: "Adot Gymnasium, Fitness Club for All",
      width: 333,
      height: 100,
    },
    photos: ["gym"],
  },
  directory: { photos: ["exterior"] },
  visit: { photos: ["facade", "exterior"] },
  about: { photos: ["facade"] },
};

function isSection(value: string): value is Section {
  return (sections as readonly string[]).includes(value);
}

export default async function SectionPage({ params }: { params: Promise<{ locale: Locale; section: string }> }) {
  const { locale, section } = await params;
  if (!isLocale(locale)) notFound();
  if (!isSection(section)) notFound();
  const t = dictionary(locale);
  const content = media[section];
  const images = content ? await getSiteImages(await getDb()) : null;
  const page = t.pages[section];
  const actionHref = section === "directory" ? `/${locale}/spaces` : `/${locale}/enquire`;
  return (
    <div className="container">
      <div className="page-head">
        {content?.logo && (
          <img
            className="section-logo"
            src={`/assets/logos/${content.logo.src}`}
            alt={content.logo.alt}
            width={content.logo.width}
            height={content.logo.height}
          />
        )}
        <h1>{t.nav[section]}</h1>
        <p className="mx-auto max-w-2xl text-lg">{page.lead}</p>
      </div>
      {content && images && (
        <div className="photo-grid">
          {content.photos.map((slot) => {
            const image = images[slot];
            const alt = (locale === "am" ? image.altAm : null) ?? image.altEn ?? t.images[slot];
            return (
              <img key={slot} src={image.src} alt={alt} width={image.width} height={image.height} loading="lazy" />
            );
          })}
        </div>
      )}
      <div className="narrow section-copy">
        {page.blocks.map((block) => (
          <section key={block.heading}>
            <h2>{block.heading}</h2>
            {block.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
        <div className="actions justify-center">
          <Link className={buttonVariants({ size: "lg" })} href={actionHref}>
            {page.action}
          </Link>
        </div>
      </div>
    </div>
  );
}
