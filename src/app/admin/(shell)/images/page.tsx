import { RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { ImageUploadField, UploadButton } from "@/components/admin/ImageUploadField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { dictionary } from "@/i18n";
import { formatWhen } from "@/lib/admin-labels";
import { orNotFound, requireUser } from "@/lib/session";
import { assertCan } from "@/server/permissions";
import { getSiteImages, siteImageSlots, type SiteImageSlot } from "@/server/site-images";
import { resetSiteImageAction, uploadSiteImageAction } from "../../actions";

export const metadata = { title: "Site images" };

export default async function SiteImagesPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error, done } = await searchParams;
  const user = await requireUser();
  await orNotFound(() => assertCan(user, "content.edit"));
  const images = await getSiteImages(await getDb());
  const en = dictionary("en").images;
  const am = dictionary("am").images;

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Site images</h1>
          <p className="hint">
            The photos on the public pages. Replacing one updates every page it appears on straight away, and you can
            always reset it to the original. Photos for individual spaces are on each{" "}
            <Link href="/admin/units">unit&apos;s page</Link>.
          </p>
        </div>
      </div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="alert success" role="status">
          {done}
        </p>
      )}

      <div className="image-grid">
        {(Object.keys(siteImageSlots) as SiteImageSlot[]).map((slot) => {
          const image = images[slot];
          const info = siteImageSlots[slot];
          const altEn = image.altEn ?? en[slot];
          const altAm = image.altAm ?? am[slot];
          return (
            <section className="dash-panel image-card" id={slot} key={slot} aria-labelledby={`${slot}-title`}>
              <header>
                <h2 id={`${slot}-title`}>{info.label}</h2>
                <Badge variant={image.custom ? "default" : "outline"}>{image.custom ? "Uploaded" : "Original"}</Badge>
              </header>
              <p className="hint">Used on: {info.usedOn.join(", ")}</p>
              {image.custom && image.updatedAt && (
                <p className="hint">
                  Replaced {formatWhen(new Date(image.updatedAt))}
                  {image.updatedBy ? ` by ${image.updatedBy}` : ""}
                </p>
              )}
              <form action={uploadSiteImageAction} className="image-form">
                <input type="hidden" name="slot" value={slot} />
                <ImageUploadField id={`${slot}-file`} current={image.src} currentAlt={altEn} />
                <div className="field">
                  <label htmlFor={`${slot}-altEn`}>Description for screen readers (English)</label>
                  <input id={`${slot}-altEn`} name="altEn" defaultValue={altEn} required maxLength={200} />
                </div>
                <div className="field">
                  <label htmlFor={`${slot}-altAm`}>Description for screen readers (Amharic)</label>
                  <input id={`${slot}-altAm`} name="altAm" lang="am" defaultValue={altAm} maxLength={200} />
                </div>
                <UploadButton>Replace image</UploadButton>
              </form>
              {image.custom && (
                <form action={resetSiteImageAction}>
                  <input type="hidden" name="slot" value={slot} />
                  <Button type="submit" size="sm" variant="ghost">
                    <RotateCcwIcon data-icon="inline-start" />
                    Reset to original photo
                  </Button>
                </form>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
