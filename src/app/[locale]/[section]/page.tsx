import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { dictionary, isLocale, type Locale } from "@/i18n";

const sections = ["cinema", "gym", "directory", "visit", "about", "contact", "privacy"] as const;
type Section = (typeof sections)[number];
type PhotoKey = keyof ReturnType<typeof dictionary>["images"];

type Photo = { key: PhotoKey; src: string; width: number; height: number };

const photos = {
  auditoriumFront: { key: "auditoriumFront", src: "cinema-auditorium-front.webp", width: 448, height: 298 },
  auditoriumAngled: { key: "auditoriumAngled", src: "cinema-auditorium-angled.webp", width: 480, height: 320 },
  gym: { key: "gym", src: "adot-gymnasium-interior.webp", width: 820, height: 1143 },
  exterior: { key: "exterior", src: "adot-multiplex-exterior.webp", width: 800, height: 1067 },
  facade: { key: "facade", src: "adot-building-facade.webp", width: 944, height: 815 },
} satisfies Record<PhotoKey, Photo>;

const media: Partial<Record<Section, { logo?: { src: string; alt: string; width: number; height: number }; photos: Photo[] }>> = {
  cinema: {
    logo: { src: "adot-cinema-horizontal.svg", alt: "Adot Cinema Theater", width: 383, height: 100 },
    photos: [photos.auditoriumFront, photos.auditoriumAngled],
  },
  gym: {
    logo: {
      src: "adot-gymnasium-horizontal-light.svg",
      alt: "Adot Gymnasium, Fitness Club for All",
      width: 333,
      height: 100,
    },
    photos: [photos.gym],
  },
  directory: { photos: [photos.exterior] },
  visit: { photos: [photos.facade, photos.exterior] },
  about: { photos: [photos.facade] },
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
      {content && (
        <div className="photo-grid">
          {content.photos.map((photo) => (
            <img
              key={photo.key}
              src={`/assets/images/${photo.src}`}
              alt={t.images[photo.key]}
              width={photo.width}
              height={photo.height}
              loading="lazy"
            />
          ))}
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
