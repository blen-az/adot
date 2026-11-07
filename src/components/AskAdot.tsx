"use client";

import { MessageCircleIcon, SendHorizontalIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AskAdotLead } from "@/components/AskAdotLead";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { dictionary, type Locale } from "@/i18n";
import { newId } from "@/lib/id";

type ChatMessage = { id: number; role: "user" | "assistant"; text: string; notice?: "fallback" | "rate_limited" };

const internalLink = /\[([^\]]+)\]\((\/(?:en|am)[^\s)]*)\)/g;

// Model text is never rendered as HTML. Only links to this site's own pages become links.
function renderAnswer(text: string) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(internalLink)) {
    parts.push(text.slice(last, match.index));
    parts.push(
      <Link key={match.index} href={match[2]}>
        {match[1]}
      </Link>,
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

export function AskAdot({ locale }: { locale: Locale }) {
  const t = dictionary(locale).assistant;
  const nav = dictionary(locale).nav;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [conversationId] = useState(newId);
  const input = useRef<HTMLInputElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const nextId = useRef(0);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => () => pending.current?.abort(), []);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }

  function updateReply(id: number, change: (message: ChatMessage) => ChatMessage) {
    setMessages((current) => current.map((message) => (message.id === id ? change(message) : message)));
  }

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const history = [...messages.filter((message) => !message.notice && message.text), { role: "user", text }];
    const userId = nextId.current++;
    const replyId = nextId.current++;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", text },
      { id: replyId, role: "assistant", text: "" },
    ]);
    setDraft("");
    setBusy(true);
    pending.current = new AbortController();
    const fail = (notice: ChatMessage["notice"]) => updateReply(replyId, (message) => ({ ...message, notice }));

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: pending.current.signal,
        body: JSON.stringify({
          locale,
          conversationId,
          messages: history.slice(-20).map((message) => ({ role: message.role, content: message.text })),
        }),
      });
      if (!response.ok || !response.body) {
        fail(response.status === 429 ? "rate_limited" : "fallback");
        return;
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const event = JSON.parse(line) as { text?: string; error?: string };
          if (event.error) fail("fallback");
          else if (event.text) updateReply(replyId, (message) => ({ ...message, text: message.text + event.text }));
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) fail("fallback");
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  if (!open) {
    return (
      <Button ref={launcher} className="ask-launcher" onClick={() => setOpen(true)}>
        <MessageCircleIcon data-icon="inline-start" />
        {t.name}
      </Button>
    );
  }

  const latest = messages.at(-1);
  return (
    <Card
      className="ask-panel gap-0 bg-popover py-0"
      role="dialog"
      aria-label={t.name}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <header className="flex items-start gap-2 border-b border-border p-3">
        <div className="min-w-0 flex-1">
          <h2 className="mb-0 text-base font-semibold">{t.name}</h2>
          <p className="my-0 text-xs text-muted-foreground">{t.disclaimer}</p>
        </div>
        <Button size="icon-sm" variant="ghost" aria-label={t.close} onClick={close}>
          <XIcon />
        </Button>
      </header>

      <MessageScrollerProvider autoScroll>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="flex flex-col gap-3 p-3">
              <MessageScrollerItem messageId="greeting">
                <Message>
                  <MessageContent>
                    <Bubble variant="muted">
                      <BubbleContent>{t.greeting}</BubbleContent>
                    </Bubble>
                    {messages.length === 0 && (
                      <div className="flex flex-wrap gap-2">
                        {t.suggestions.map((suggestion) => (
                          <Button key={suggestion} size="sm" variant="outline" onClick={() => void ask(suggestion)}>
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
              {messages.map((message) => (
                <MessageScrollerItem key={message.id} messageId={String(message.id)} scrollAnchor={message.role === "user"}>
                  <Message align={message.role === "user" ? "end" : "start"}>
                    <MessageContent>
                      <Bubble variant={message.role === "user" ? "tinted" : "muted"}>
                        <BubbleContent className="whitespace-pre-wrap">
                          {message.notice === "rate_limited" ? (
                            t.rateLimited
                          ) : message.notice === "fallback" ? (
                            <>
                              {t.fallback}{" "}
                              <Link href={`/${locale}/spaces`}>{nav.spaces}</Link> ·{" "}
                              <Link href={`/${locale}/enquire`}>{t.enquire}</Link> ·{" "}
                              <Link href={`/${locale}/contact`}>{nav.contact}</Link>
                            </>
                          ) : message.text ? (
                            renderAnswer(message.text)
                          ) : (
                            t.thinking
                          )}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>

      <div role="status" className="sr-only">
        {!busy && latest?.role === "assistant" ? (latest.notice ? t.fallback : latest.text) : ""}
      </div>

      {leaving ? (
        <AskAdotLead locale={locale} conversationId={conversationId} onClose={() => setLeaving(false)} />
      ) : (
        <>
          <div className="border-t border-border px-3 pt-2">
            <Button size="sm" variant="link" className="h-auto p-0" onClick={() => setLeaving(true)}>
              {t.leadOpen}
            </Button>
          </div>
          <form className="flex gap-2 p-3" onSubmit={submit}>
            <Input
              ref={input}
              aria-label={t.placeholder}
              placeholder={t.placeholder}
              value={draft}
              maxLength={1500}
              autoComplete="off"
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button size="icon-lg" className="size-11" type="submit" aria-label={t.send} disabled={busy || !draft.trim()}>
              <SendHorizontalIcon />
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
