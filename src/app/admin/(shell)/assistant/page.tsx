import Link from "next/link";
import { getDb } from "@/db/client";
import { orNotFound, requireUser } from "@/lib/session";
import { assistantStats, listConversations, listUnanswered, type ConversationFilters } from "@/server/assistant-log";
import { getAssistantSettings } from "@/server/settings";

type Search = { show?: string; search?: string };

const shows = ["unanswered", "failed", "lead"] as const;

function isShow(value?: string): value is NonNullable<ConversationFilters["show"]> {
  return (shows as readonly string[]).includes(value ?? "");
}

const when = (date: Date) => date.toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" });

export default async function AssistantPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const user = await requireUser();
  const db = await getDb();
  const stats = await orNotFound(() => assistantStats(db, user));
  const unanswered = await listUnanswered(db, user);
  const { retentionDays } = await getAssistantSettings(db);
  const conversations = await listConversations(db, user, {
    show: isShow(search.show) ? search.show : undefined,
    search: search.search,
  });

  return (
    <>
      <h1>Ask Adot</h1>
      <p className="hint">
        Chats are deleted {retentionDays} days after their last message. Change this in{" "}
        <Link href="/admin/settings">Settings</Link>.
      </p>

      <section className="panel">
        <h2>Last {stats.windowDays} days</h2>
        <dl className="facts">
          <dt>Conversations</dt>
          <dd>
            {stats.conversations} ({stats.byLocale.en ?? 0} English, {stats.byLocale.am ?? 0} Amharic)
          </dd>
          <dt>Questions</dt>
          <dd>{stats.totals.questions}</dd>
          <dt>Couldn&apos;t answer</dt>
          <dd>{stats.totals.unanswered}</dd>
          <dt>Failed</dt>
          <dd>{stats.totals.failed}</dd>
          <dt>Blocked by limits</dt>
          <dd>{stats.blocked}</dd>
          <dt>Leads</dt>
          <dd>
            <Link href="/admin/inbox?source=assistant">{stats.leads}</Link>
          </dd>
        </dl>
      </section>

      {stats.days.length > 0 && (
        <>
          <h2>By day</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Questions</th>
                  <th>Answered</th>
                  <th>Couldn&apos;t answer</th>
                  <th>Failed</th>
                </tr>
              </thead>
              <tbody>
                {stats.days.map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.questions}</td>
                    <td>{day.answered}</td>
                    <td>{day.unanswered}</td>
                    <td>{day.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Questions it couldn&apos;t answer</h2>
      {unanswered.length === 0 ? (
        <p>None yet.</p>
      ) : (
        <>
          <p className="hint">
            Add verified answers to the <Link href="/admin/settings">approved FAQs</Link> so Ask Adot can answer these next time.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asked</th>
                  <th>Question</th>
                </tr>
              </thead>
              <tbody>
                {unanswered.map((exchange) => (
                  <tr key={exchange.id}>
                    <td>{when(exchange.createdAt)}</td>
                    <td>
                      <Link href={`/admin/assistant/${exchange.conversationId}`}>{exchange.question}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Conversations</h2>
      <form className="filters" method="get">
        <div className="field">
          <label htmlFor="search">Search</label>
          <input id="search" name="search" defaultValue={search.search} placeholder="Words in a question or answer" />
        </div>
        <div className="field">
          <label htmlFor="show">Show</label>
          <select id="show" name="show" defaultValue={search.show ?? ""}>
            <option value="">All</option>
            <option value="unanswered">Couldn&apos;t answer</option>
            <option value="failed">Failed</option>
            <option value="lead">Left details</option>
          </select>
        </div>
        <button className="button secondary" type="submit">
          Filter
        </button>
      </form>

      {conversations.length === 0 ? (
        <p>No conversations match.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Last message</th>
                <th>First question</th>
                <th>Language</th>
                <th>Questions</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td>{when(conversation.lastMessageAt)}</td>
                  <td>
                    <Link href={`/admin/assistant/${conversation.id}`}>{conversation.firstQuestion || "View"}</Link>
                  </td>
                  <td>{conversation.locale === "am" ? "Amharic" : "English"}</td>
                  <td>{conversation.questions}</td>
                  <td>
                    {[
                      conversation.hasLead && "Left details",
                      conversation.unanswered > 0 && `${conversation.unanswered} couldn't answer`,
                      conversation.failed > 0 && `${conversation.failed} failed`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
