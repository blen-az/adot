import { getDb } from "@/db/client";
import { clientAddress } from "@/lib/request";
import type { AssistantOutcome } from "@/db/schema";
import { askRequest, checkAssistantGate, streamAnswer } from "@/server/assistant";
import { recordExchange } from "@/server/assistant-log";

function failure(error: string, status: number) {
  return Response.json({ error }, { status });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return new URL(origin).host === host;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure("forbidden", 403);
  const parsed = askRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("invalid", 400);

  const db = await getDb();
  const gate = await checkAssistantGate(db, await clientAddress());
  if (gate === "disabled" || gate === "over_budget") return failure("unavailable", 503);
  if (gate === "rate_limited") return failure("rate_limited", 429);

  const encoder = new TextEncoder();
  const send = (event: object) => encoder.encode(`${JSON.stringify(event)}\n`);
  const { conversationId, locale, messages } = parsed.data;
  let disconnected = false;
  const body = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => {
        if (!disconnected) controller.enqueue(send(event));
      };
      let answer = "";
      let outcome: AssistantOutcome = "answered";
      try {
        const markUnanswered = () => {
          outcome = "unanswered";
        };
        for await (const text of streamAnswer(db, parsed.data, undefined, markUnanswered)) {
          answer += text;
          emit({ text });
        }
      } catch (error) {
        outcome = "failed";
        console.error("Ask Adot failed", error instanceof Error ? error.message : "unknown error");
        emit({ error: "unavailable" });
      }
      // The visitor already has their answer, so a logging failure must not reach them.
      await recordExchange(db, { conversationId, locale, question: messages.at(-1)?.content ?? "", answer, outcome }).catch((error) =>
        console.error("Ask Adot log failed", error instanceof Error ? error.message : "unknown error"),
      );
      if (!disconnected) controller.close();
    },
    cancel() {
      disconnected = true;
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
