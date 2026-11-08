import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { settings } from "@/db/schema";
import { ValidationError } from "./errors";
import { assertCan, type Actor } from "./permissions";

const KEY = "site_images";

/**
 * Photo slots on the public site. Each has a bundled default in /public/assets/images, so the
 * site always has a picture; staff can replace any slot with an upload and reset it later.
 * Keys match the `images` alt-text keys in the i18n dictionary.
 */
export const siteImageSlots = {
  auditoriumFront: {
    label: "Cinema auditorium, front",
    usedOn: ["Cinema page"],
    file: "cinema-auditorium-front.webp",
    card: "cinema-auditorium-front-card.webp",
    width: 448,
    height: 298,
  },
  auditoriumAngled: {
    label: "Cinema auditorium, side",
    usedOn: ["Cinema page", "Home page: Cinema card"],
    file: "cinema-auditorium-angled.webp",
    card: "cinema-auditorium-angled-card.webp",
    width: 480,
    height: 320,
  },
  gym: {
    label: "Gym",
    usedOn: ["Gym page", "Home page: Gym card"],
    file: "adot-gymnasium-interior.webp",
    card: "adot-gymnasium-interior-card.webp",
    width: 820,
    height: 1143,
  },
  exterior: {
    label: "Street entrance",
    usedOn: ["Directory page", "Visit page", "Home page: Directory card"],
    file: "adot-multiplex-exterior.webp",
    card: "adot-multiplex-exterior-card.webp",
    width: 800,
    height: 1067,
  },
  facade: {
    label: "Building facade",
    usedOn: ["Visit page", "About page", "Home page: Visit card"],
    file: "adot-building-facade.webp",
    card: "adot-building-facade-card.webp",
    width: 944,
    height: 815,
  },
} as const;

export type SiteImageSlot = keyof typeof siteImageSlots;

type Stored = { fileName: string; altEn: string; altAm: string; updatedAt: string; updatedBy: string };

export type SiteImage = {
  slot: SiteImageSlot;
  /** Full-size image for section pages. */
  src: string;
  /** Smaller crop for home-page cards. Uploads use the same file, cropped by CSS. */
  cardSrc: string;
  /** Known only for the bundled defaults. */
  width?: number;
  height?: number;
  /** Null means "use the dictionary's default alt text". */
  altEn: string | null;
  altAm: string | null;
  custom: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

export function isSiteImageSlot(value: string): value is SiteImageSlot {
  return Object.hasOwn(siteImageSlots, value);
}

export async function getSiteImages(db: Db): Promise<Record<SiteImageSlot, SiteImage>> {
  const [row] = await db.select().from(settings).where(eq(settings.key, KEY));
  const stored = (row?.value ?? {}) as Partial<Record<SiteImageSlot, Stored>>;
  const entries = (Object.keys(siteImageSlots) as SiteImageSlot[]).map((slot): [SiteImageSlot, SiteImage] => {
    const fallback = siteImageSlots[slot];
    const upload = stored[slot];
    if (!upload) {
      return [
        slot,
        {
          slot,
          src: `/assets/images/${fallback.file}`,
          cardSrc: `/assets/images/${fallback.card}`,
          width: fallback.width,
          height: fallback.height,
          altEn: null,
          altAm: null,
          custom: false,
          updatedAt: null,
          updatedBy: null,
        },
      ];
    }
    return [
      slot,
      {
        slot,
        src: `/media/${upload.fileName}`,
        cardSrc: `/media/${upload.fileName}`,
        altEn: upload.altEn,
        altAm: upload.altAm || null,
        custom: true,
        updatedAt: upload.updatedAt,
        updatedBy: upload.updatedBy,
      },
    ];
  });
  return Object.fromEntries(entries) as Record<SiteImageSlot, SiteImage>;
}

export async function setSiteImage(
  db: Db,
  actor: Actor & { name: string },
  slot: string,
  image: { fileName: string; altEn: string; altAm: string },
) {
  assertCan(actor, "content.edit");
  if (!isSiteImageSlot(slot)) throw new ValidationError(["Unknown image slot"]);
  const altEn = image.altEn.trim().slice(0, 200);
  if (!altEn) throw new ValidationError(["English alternative text is required"]);
  const entry: Stored = {
    fileName: image.fileName,
    altEn,
    altAm: image.altAm.trim().slice(0, 200),
    updatedAt: new Date().toISOString(),
    updatedBy: actor.name,
  };
  const patch = JSON.stringify({ [slot]: entry });
  // One atomic merge, so two staff replacing different slots at once can't overwrite each other.
  await db
    .insert(settings)
    .values({ key: KEY, value: { [slot]: entry } })
    .onConflictDoUpdate({ target: settings.key, set: { value: sql`${settings.value} || ${patch}::jsonb` } });
}

export async function resetSiteImage(db: Db, actor: Actor, slot: string) {
  assertCan(actor, "content.edit");
  if (!isSiteImageSlot(slot)) throw new ValidationError(["Unknown image slot"]);
  await db
    .update(settings)
    .set({ value: sql`${settings.value} - ${slot}::text` })
    .where(eq(settings.key, KEY));
}
