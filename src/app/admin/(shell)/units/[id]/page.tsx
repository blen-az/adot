import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { auditLog, users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { can } from "@/server/permissions";
import { getUnitForStaff, publishIssues, translationWarnings } from "@/server/units";
import {
  moveMediaAction,
  removeMediaAction,
  unitAvailabilityAction,
  unitLifecycleAction,
  uploadMediaAction,
} from "../../../actions";
import { UnitForm } from "../UnitForm";

const uuid = /^[0-9a-f-]{36}$/i;

export default async function UnitEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!uuid.test(id)) notFound();
  const user = await requireUser();
  const db = await getDb();
  const unit = await getUnitForStaff(db, user, id);
  if (!unit) notFound();
  const history = await db
    .select({ id: auditLog.id, action: auditLog.action, createdAt: auditLog.createdAt, actor: users.name })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .where(and(eq(auditLog.entityType, "unit"), eq(auditLog.entityId, id)))
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  const issues = publishIssues(unit);
  const warnings = translationWarnings(unit);
  const lifecycle = (step: string, label: string, className = "button secondary") => (
    <form action={unitLifecycleAction}>
      <input type="hidden" name="id" value={id} />
      <button className={className} name="step" value={step} type="submit">
        {label}
      </button>
    </form>
  );

  return (
    <>
      <h1>{unit.titleEn}</h1>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <section className="panel">
        <p>
          Publication: <strong>{unit.publication}</strong> · Availability:{" "}
          <strong>{unit.availability.replace("_", " ")}</strong>
        </p>
        {unit.publication !== "published" && issues.length > 0 && (
          <div className="alert warning">Needed before publishing: {issues.join(". ")}.</div>
        )}
        {warnings.length > 0 && <div className="alert warning">Translation: {warnings.join(". ")}.</div>}
        <div className="actions">
          <Link className="button secondary" href={`/admin/units/${id}/preview`}>
            Preview
          </Link>
          {unit.publication === "draft" && lifecycle("publish", "Publish", "button")}
          {unit.publication === "published" && lifecycle("unpublish", "Return to draft")}
          {unit.publication !== "archived" && lifecycle("archive", "Archive", "button danger")}
          {unit.publication === "archived" && lifecycle("restore", "Restore to draft")}
        </div>
        {can(user, "units.availability") && (
          <form action={unitAvailabilityAction} className="filters">
            <input type="hidden" name="id" value={id} />
            <div className="field">
              <label htmlFor="availability">Availability</label>
              <select id="availability" name="availability" defaultValue={unit.availability}>
                <option value="available">Available</option>
                <option value="under_discussion">Under discussion</option>
                <option value="leased">Leased</option>
              </select>
            </div>
            <button className="button secondary" type="submit">
              Update availability
            </button>
          </form>
        )}
      </section>

      <h2>Details</h2>
      <UnitForm
        id={id}
        initial={{
          titleEn: unit.titleEn,
          titleAm: unit.titleAm,
          reference: unit.reference,
          floor: unit.floor,
          category: unit.category,
          areaM2: unit.areaM2 ?? "",
          descriptionEn: unit.descriptionEn,
          descriptionAm: unit.descriptionAm,
          permittedUseEn: unit.permittedUseEn,
          permittedUseAm: unit.permittedUseAm,
          featuresEn: unit.featuresEn.join("\n"),
          featuresAm: unit.featuresAm.join("\n"),
          rentEtb: unit.rentEtb ?? "",
          billingPeriod: unit.billingPeriod ?? "",
          serviceChargeEtb: unit.serviceChargeEtb ?? "",
          availableFrom: unit.availableFrom ?? "",
          rentPublic: unit.rentPublic ? "on" : "",
        }}
      />

      <h2>Images</h2>
      <section className="panel">
        <p className="hint">The first image is the cover. Use only genuine, approved Adot photographs.</p>
        {unit.media.map((media, index) => (
          <div className="media-row" key={media.id}>
            <img src={`/media/${media.fileName}`} alt={media.altEn} />
            <span>{media.altEn}</span>
            <form action={moveMediaAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="mediaId" value={media.id} />
              <button className="button small secondary" name="direction" value="up" disabled={index === 0}>
                Move up
              </button>{" "}
              <button
                className="button small secondary"
                name="direction"
                value="down"
                disabled={index === unit.media.length - 1}
              >
                Move down
              </button>
            </form>
            <form action={removeMediaAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="mediaId" value={media.id} />
              <button className="button small danger">Remove</button>
            </form>
          </div>
        ))}
        <form action={uploadMediaAction}>
          <input type="hidden" name="id" value={id} />
          <div className="field-grid">
            <div className="field">
              <label htmlFor="file">Image (JPEG, PNG or WebP, up to 5 MB)</label>
              <input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
            </div>
            <div className="field">
              <label htmlFor="altEn">Alternative text (English)</label>
              <input id="altEn" name="altEn" required />
            </div>
            <div className="field">
              <label htmlFor="altAm">Alternative text (Amharic)</label>
              <input id="altAm" name="altAm" lang="am" />
            </div>
          </div>
          <button className="button secondary" type="submit">
            Upload image
          </button>
        </form>
      </section>

      <h2>History</h2>
      <div className="table-wrap">
        <table>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" })}</td>
                <td>{entry.action}</td>
                <td>{entry.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
