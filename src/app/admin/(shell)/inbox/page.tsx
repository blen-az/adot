import Link from "next/link";
import { getDb } from "@/db/client";
import { enquirySourceEnum, enquiryStatusEnum, type EnquirySource, type EnquiryStatus } from "@/db/schema";
import { orNotFound, requireUser } from "@/lib/session";
import { listAssignees, listInbox } from "@/server/enquiries";
import { listUnitsForStaff } from "@/server/units";

type Search = {
  status?: string;
  unitId?: string;
  assigneeId?: string;
  source?: string;
  from?: string;
  to?: string;
  search?: string;
};

function isStatus(value?: string): value is EnquiryStatus {
  return (enquiryStatusEnum.enumValues as readonly string[]).includes(value ?? "");
}

function isSource(value?: string): value is EnquirySource {
  return (enquirySourceEnum.enumValues as readonly string[]).includes(value ?? "");
}

const uuid = /^[0-9a-f-]{36}$/i;
const day = /^\d{4}-\d{2}-\d{2}$/;

export default async function InboxPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const user = await requireUser();
  const db = await getDb();
  const assignees = await orNotFound(() => listAssignees(db, user));
  const units = await listUnitsForStaff(db, user);
  const enquiries = await listInbox(db, user, {
    status: isStatus(search.status) ? search.status : undefined,
    unitId: uuid.test(search.unitId ?? "") ? search.unitId : undefined,
    assigneeId: uuid.test(search.assigneeId ?? "") ? search.assigneeId : undefined,
    source: isSource(search.source) ? search.source : undefined,
    from: day.test(search.from ?? "") ? search.from : undefined,
    to: day.test(search.to ?? "") ? search.to : undefined,
    search: search.search,
  });
  const nameOf = (id: string | null) => assignees.find((a) => a.id === id)?.name ?? "Unassigned";

  return (
    <>
      <h1>Inbox</h1>
      <form className="filters" method="get">
        <div className="field">
          <label htmlFor="search">Search</label>
          <input id="search" name="search" defaultValue={search.search} placeholder="Reference, name, phone or unit" />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={search.status ?? ""}>
            <option value="">Any</option>
            {enquiryStatusEnum.enumValues.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="unitId">Unit</label>
          <select id="unitId" name="unitId" defaultValue={search.unitId ?? ""}>
            <option value="">Any</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.titleEn}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="assigneeId">Assignee</label>
          <select id="assigneeId" name="assigneeId" defaultValue={search.assigneeId ?? ""}>
            <option value="">Any</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="source">Source</label>
          <select id="source" name="source" defaultValue={search.source ?? ""}>
            <option value="">Any</option>
            <option value="website">Website form</option>
            <option value="assistant">Ask Adot</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={search.from} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={search.to} />
        </div>
        <button className="button secondary" type="submit">
          Filter
        </button>
      </form>

      {enquiries.length === 0 ? (
        <p>No enquiries match.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Received</th>
                <th>Type / unit</th>
                <th>Contact</th>
                <th>Use</th>
                <th>Status</th>
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td>
                    <Link href={`/admin/inbox/${enquiry.id}`}>{enquiry.reference}</Link>
                  </td>
                  <td>{enquiry.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" })}</td>
                  <td>
                    {enquiry.unitSnapshot?.title ?? enquiry.type.replace("_", " ")}
                    {enquiry.source === "assistant" && " (Ask Adot)"}
                  </td>
                  <td>
                    {enquiry.name}
                    <br />
                    {enquiry.phone}
                  </td>
                  <td>{enquiry.intendedUse}</td>
                  <td>{enquiry.status.replace("_", " ")}</td>
                  <td>{nameOf(enquiry.assigneeId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
