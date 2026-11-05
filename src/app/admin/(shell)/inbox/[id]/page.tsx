import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { enquiryStatusEnum } from "@/db/schema";
import { orNotFound, requireUser } from "@/lib/session";
import { getEnquiryDetail, listAssignees } from "@/server/enquiries";
import {
  enquiryAssignAction,
  enquiryNoteAction,
  enquiryStatusAction,
  retryNotificationAction,
} from "../../../actions";

const when = (date: Date) => date.toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" });

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser();
  const db = await getDb();
  const { enquiry, notes, notifications, history } = await orNotFound(() => getEnquiryDetail(db, user, id));
  const assignees = await listAssignees(db, user);

  return (
    <>
      <p>
        <Link href="/admin/inbox">Back to inbox</Link>
      </p>
      <h1>{enquiry.reference}</h1>
      <div className="field-grid">
        <section className="panel">
          <h2>Enquiry</h2>
          <dl className="facts">
            <dt>Type</dt>
            <dd>{enquiry.type.replace("_", " ")}</dd>
            {enquiry.unitSnapshot && (
              <>
                <dt>Unit</dt>
                <dd>
                  {enquiry.unitId ? (
                    <Link href={`/admin/units/${enquiry.unitId}`}>{enquiry.unitSnapshot.title}</Link>
                  ) : (
                    enquiry.unitSnapshot.title
                  )}{" "}
                  ({enquiry.unitSnapshot.reference})
                </dd>
              </>
            )}
            <dt>Name</dt>
            <dd>{enquiry.name}</dd>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
            </dd>
            {enquiry.email && (
              <>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                </dd>
              </>
            )}
            {enquiry.company && (
              <>
                <dt>Company</dt>
                <dd>{enquiry.company}</dd>
              </>
            )}
            <dt>Intended use</dt>
            <dd>{enquiry.intendedUse}</dd>
            {enquiry.desiredArea && (
              <>
                <dt>Area needed</dt>
                <dd>{enquiry.desiredArea}</dd>
              </>
            )}
            {enquiry.preferredDate && (
              <>
                <dt>Requested viewing</dt>
                <dd>{enquiry.preferredDate} (not confirmed)</dd>
              </>
            )}
            {enquiry.contactMethod && (
              <>
                <dt>Contact by</dt>
                <dd>{enquiry.contactMethod}</dd>
              </>
            )}
            <dt>Language</dt>
            <dd>{enquiry.locale === "am" ? "Amharic" : "English"}</dd>
            <dt>Marketing opt-in</dt>
            <dd>{enquiry.marketingConsent ? "Yes" : "No"}</dd>
            <dt>Received</dt>
            <dd>{when(enquiry.createdAt)}</dd>
          </dl>
          <p style={{ whiteSpace: "pre-wrap" }}>{enquiry.message}</p>
        </section>

        <section className="panel">
          <h2>Follow-up</h2>
          <form action={enquiryStatusAction} className="field">
            <input type="hidden" name="id" value={id} />
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={enquiry.status}>
              {enquiryStatusEnum.enumValues.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
            <button className="button small secondary" type="submit">
              Update status
            </button>
          </form>
          <form action={enquiryAssignAction} className="field">
            <input type="hidden" name="id" value={id} />
            <label htmlFor="assigneeId">Assignee</label>
            <select id="assigneeId" name="assigneeId" defaultValue={enquiry.assigneeId ?? ""}>
              <option value="">Unassigned</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
            <button className="button small secondary" type="submit">
              Assign
            </button>
          </form>
          <form action={enquiryNoteAction} className="field">
            <input type="hidden" name="id" value={id} />
            <label htmlFor="body">Add a private note</label>
            <textarea id="body" name="body" rows={3} required />
            <span className="hint">Use this to record calls and offline replies.</span>
            <button className="button small secondary" type="submit">
              Save note
            </button>
          </form>
        </section>
      </div>

      <h2>Notes</h2>
      {notes.length === 0 ? (
        <p>No notes yet.</p>
      ) : (
        notes.map((note) => (
          <div className="panel" key={note.id}>
            <p className="meta">
              {note.author} · {when(note.createdAt)}
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>{note.body}</p>
          </div>
        ))
      )}

      <h2>Staff notifications</h2>
      {notifications.length === 0 ? (
        <p>No recipients were configured for this enquiry.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Last error</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {notifications.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.recipient}</td>
                  <td>{attempt.status}</td>
                  <td>{attempt.attempts}</td>
                  <td>{attempt.lastError}</td>
                  <td>
                    {attempt.status !== "sent" && (
                      <form action={retryNotificationAction}>
                        <input type="hidden" name="id" value={id} />
                        <input type="hidden" name="attemptId" value={attempt.id} />
                        <button className="button small secondary" type="submit">
                          Retry
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>History</h2>
      {history.length === 0 ? (
        <p>No changes yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td>{when(entry.createdAt)}</td>
                  <td>{entry.action}</td>
                  <td>{entry.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
