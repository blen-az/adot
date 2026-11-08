import { ImageOffIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { availabilityLabels, publicationLabels, timeAgo } from "@/lib/admin-labels";
import { requireUser } from "@/lib/session";
import { listUnitsWithMediaForStaff } from "@/server/units";

export const metadata = { title: "Units" };

export default async function UnitsPage() {
  const user = await requireUser();
  const units = await listUnitsWithMediaForStaff(await getDb(), user);
  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Units</h1>
          <p className="hint">
            {units.length} unit{units.length === 1 ? "" : "s"}. Only published units with an image appear on the public
            site.
          </p>
        </div>
        <Link className={buttonVariants({ size: "sm" })} href="/admin/units/new">
          <PlusIcon data-icon="inline-start" />
          New unit
        </Link>
      </div>
      {units.length === 0 ? (
        <section className="dash-panel">
          <p>No units yet. Create the first one to start listing spaces.</p>
        </section>
      ) : (
        <div className="table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Floor</th>
                <th>Area</th>
                <th>Publication</th>
                <th>Availability</th>
                <th>Images</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td>
                    <Link className="unit-cell" href={`/admin/units/${unit.id}`}>
                      {unit.media[0] ? (
                        <img src={`/media/${unit.media[0].fileName}`} alt="" loading="lazy" />
                      ) : (
                        <span className="unit-cell-empty" aria-hidden="true">
                          <ImageOffIcon />
                        </span>
                      )}
                      <span>
                        <strong>{unit.titleEn}</strong>
                        <span className="hint">
                          {unit.reference} · {unit.category}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td>{unit.floor}</td>
                  <td>{unit.areaM2 ? `${Number(unit.areaM2).toLocaleString("en-GB")} m²` : "–"}</td>
                  <td>
                    <Badge variant={unit.publication === "published" ? "default" : "outline"}>
                      {publicationLabels[unit.publication]}
                    </Badge>
                  </td>
                  <td>{availabilityLabels[unit.availability]}</td>
                  <td>{unit.media.length === 0 ? <span className="text-destructive">None</span> : unit.media.length}</td>
                  <td className="hint">{timeAgo(unit.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
