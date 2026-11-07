import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { orNotFound, requireUser } from "@/lib/session";
import { getConversation } from "@/server/assistant-log";
import { deleteConversationAction } from "../../../actions";

const when = (date: Date) => date.toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" });

const outcomeNote = { answered: null, unanswered: "Ask Adot couldn't answer this", failed: "This reply failed" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser();
  const db = await getDb();
  const detail = await orNotFound(() => getConversation(db, user, id));
  if (!detail) notFound();
  const { conversation, exchanges, leads } = detail;

  return (
    <>
      <p>
        <Link href="/admin/assistant">Back to Ask Adot</Link>
      </p>
      <h1>Conversation</h1>
      <section className="panel">
        <dl className="facts">
          <dt>Started</dt>
          <dd>{when(conversation.startedAt)}</dd>
          <dt>Last message</dt>
          <dd>{when(conversation.lastMessageAt)}</dd>
          <dt>Language</dt>
          <dd>{conversation.locale === "am" ? "Amharic" : "English"}</dd>
          {leads.length > 0 && (
            <>
              <dt>Left details</dt>
              <dd>
                {leads.map((lead) => (
                  <Link key={lead.id} href={`/admin/inbox/${lead.id}`}>
                    {lead.reference}
                  </Link>
                ))}
              </dd>
            </>
          )}
        </dl>
      </section>

      {exchanges.map((exchange) => (
        <section className="panel" key={exchange.id}>
          <p className="hint">{when(exchange.createdAt)}</p>
          <p>
            <strong>Visitor:</strong> <span style={{ whiteSpace: "pre-wrap" }}>{exchange.question}</span>
          </p>
          <p>
            <strong>Ask Adot:</strong> <span style={{ whiteSpace: "pre-wrap" }}>{exchange.answer || "No reply"}</span>
          </p>
          {outcomeNote[exchange.outcome] && <p className="hint">{outcomeNote[exchange.outcome]}</p>}
        </section>
      ))}

      <form action={deleteConversationAction}>
        <input type="hidden" name="id" value={conversation.id} />
        <button className="button secondary" type="submit">
          Delete this conversation
        </button>
        <p className="hint">This can&apos;t be undone. Any details the visitor left stay in the inbox.</p>
      </form>
    </>
  );
}
