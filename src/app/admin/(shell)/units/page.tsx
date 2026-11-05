import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/session";
import { listUnitsForStaff } from "@/server/units";

export default async function UnitsPage() {
  const user = await requireUser();
  const units = await listUnitsForStaff(await getDb(), user);
  return (
    <>
      <div className="actions">
        <h1>Units</h1>
        <Link className="button" href="/admin/units/new">
          New unit
        </Link>
      </div>
      {units.length === 0 ? (
        <p>No units yet. Create the first one.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Reference</th>
                <th>Floor</th>
                <th>Publication</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td>
                    <Link href={`/admin/units/${unit.id}`}>{unit.titleEn}</Link>
                  </td>
                  <td>{unit.reference}</td>
                  <td>{unit.floor}</td>
                  <td>{unit.publication}</td>
                  <td>{unit.availability.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
