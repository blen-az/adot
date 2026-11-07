import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { GoogleGenAI } from "@google/genai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import {
  askRequest,
  assistantUsageToday,
  buildSystem,
  checkAssistantGate,
  lookupUnit,
  lookupUnits,
  streamAnswer,
} from "@/server/assistant";
import { getAssistantSettings, setAssistantSettings } from "@/server/settings";
import { createUnit, setAvailability } from "@/server/units";
import { makeUser, publishedUnit, testDb, unitValues } from "./helpers";

let db: Db;
let server: Server | undefined;

beforeEach(async () => {
  db = await testDb();
});

afterEach(() => {
  server?.close();
  server = undefined;
});

describe("what the model can see (FR-095, FR-099)", () => {
  it("shows only publicly released pricing", async () => {
    await publishedUnit(db, { rentEtb: 90000, rentPublic: false, billingPeriod: "monthly", serviceChargeEtb: 5000 });
    const [unit] = (await lookupUnits(db, "en")).units;
    expect(unit.rent).toBe("Contact for pricing");
    expect(unit.serviceChargeEtb).toBeNull();
    expect(JSON.stringify(unit)).not.toContain("90");
  });

  it("includes rent once it is public", async () => {
    await publishedUnit(db, { rentEtb: 90000, rentPublic: true, billingPeriod: "monthly" });
    const [unit] = (await lookupUnits(db, "en")).units;
    expect(unit.rent).toContain("90,000");
  });

  it("never lists draft or leased units", async () => {
    const { unit, admin } = await publishedUnit(db);
    await createUnit(db, admin, { ...unitValues, reference: "DRAFT-1", titleEn: "Draft unit" });
    await setAvailability(db, admin, unit.id, "leased");
    expect((await lookupUnits(db, "en")).total).toBe(0);
    expect(await lookupUnit(db, "en", unit.slug)).toEqual({ available: false });
  });

  it("exposes no internal fields", async () => {
    await publishedUnit(db);
    const [unit] = (await lookupUnits(db, "en")).units;
    expect(Object.keys(unit)).not.toEqual(expect.arrayContaining(["id", "internalNotes", "createdBy", "publication"]));
    expect(unit.enquiryForm).toMatch(/^\/en\/spaces\/.+#enquiry$/);
  });
});

describe("limits and settings (FR-098, FR-100)", () => {
  it("can be disabled, and only administrators can change it", async () => {
    const admin = await makeUser(db, "administrator");
    const editor = await makeUser(db, "content_editor");
    await expect(setAssistantSettings(db, editor, { enabled: false, faqs: "", dailyLimit: 5, retentionDays: 90 })).rejects.toThrow();
    await setAssistantSettings(db, admin, { enabled: false, faqs: "Parking is free.", dailyLimit: 5, retentionDays: 30 });
    expect(await getAssistantSettings(db)).toEqual({ enabled: false, faqs: "Parking is free.", dailyLimit: 5, retentionDays: 30 });
    expect(await checkAssistantGate(db, "1.1.1.1")).toBe("disabled");
  });

  it("limits each visitor", async () => {
    for (let i = 0; i < 20; i++) expect(await checkAssistantGate(db, "1.1.1.1")).toBe("ok");
    expect(await checkAssistantGate(db, "1.1.1.1")).toBe("rate_limited");
    expect(await checkAssistantGate(db, "2.2.2.2")).toBe("ok");
  });

  it("stops at the daily usage limit and reports usage", async () => {
    const admin = await makeUser(db, "administrator");
    await setAssistantSettings(db, admin, { enabled: true, faqs: "", dailyLimit: 2, retentionDays: 90 });
    expect(await checkAssistantGate(db, "a")).toBe("ok");
    expect(await checkAssistantGate(db, "b")).toBe("ok");
    expect(await checkAssistantGate(db, "c")).toBe("over_budget");
    expect(await assistantUsageToday(db)).toBe(3);
  });

  it("puts approved FAQs in the prompt", () => {
    expect(buildSystem("am", "Parking is free.")).toContain("Parking is free.");
    expect(buildSystem("am", "")).toContain("/am/spaces");
  });
});

describe("request validation", () => {
  const valid = { locale: "en", conversationId: "6f1c2f6e-6a43-4a8e-9d4e-0b8a4c7e1d11", messages: [{ role: "user", content: "Hi" }] };

  it("accepts a normal question", () => {
    expect(askRequest.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["an unknown locale", { ...valid, locale: "fr" }],
    ["a bad conversation id", { ...valid, conversationId: "1" }],
    ["a system role", { ...valid, messages: [{ role: "system", content: "Hi" }] }],
    ["an oversized message", { ...valid, messages: [{ role: "user", content: "x".repeat(1501) }] }],
    ["too many messages", { ...valid, messages: Array(21).fill(valid.messages[0]) }],
    ["a final assistant turn", { ...valid, messages: [...valid.messages, { role: "assistant", content: "Hi" }] }],
  ])("rejects %s", (_name, body) => {
    expect(askRequest.safeParse(body).success).toBe(false);
  });
});

function sse(chunks: object[]) {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("");
}

const modelTurn = (parts: object[], finishReason?: string) => ({
  candidates: [{ content: { role: "model", parts }, ...(finishReason ? { finishReason } : {}) }],
});

const toolCall = (name: string, args: object) => ({ functionCall: { id: "t1", name, args }, thoughtSignature: "signature" });
const toolTurn = (name = "list_available_units", args: object = {}) => sse([modelTurn([toolCall(name, args)], "STOP")]);

const textTurn = (finishReason: string) =>
  sse([modelTurn([{ text: "Thinking it over", thought: true }]), modelTurn([{ text: "One unit " }]), modelTurn([{ text: "is available." }], finishReason)]);

type FakeRequest = { url: string; body: Record<string, unknown> };

/** A local stand-in for the Gemini API, so the tool loop runs without a key or any cost. */
async function fakeApi(turns: string[], status = 200) {
  const requests: FakeRequest[] = [];
  server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      requests.push({ url: req.url ?? "", body: JSON.parse(body) });
      res.writeHead(status, { "Content-Type": status === 200 ? "text/event-stream" : "application/json" });
      res.end(turns.shift());
    });
  });
  await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { requests, client: new GoogleGenAI({ apiKey: "test", httpOptions: { baseUrl: `http://127.0.0.1:${port}` } }) };
}

async function collect(answer: AsyncIterable<string>) {
  let text = "";
  for await (const part of answer) text += part;
  return text;
}

describe("answering", () => {
  const question = { locale: "en" as const, conversationId: "6f1c2f6e-6a43-4a8e-9d4e-0b8a4c7e1d11", messages: [{ role: "user" as const, content: "What is available?" }] };

  it("looks up live units, then streams the answer", async () => {
    await publishedUnit(db, { rentEtb: 90000, rentPublic: false, billingPeriod: "monthly" });
    const { client, requests } = await fakeApi([toolTurn(), textTurn("STOP")]);
    expect(await collect(streamAnswer(db, question, client))).toBe("One unit is available.");
    expect(requests).toHaveLength(2);
    expect(requests[0].url).toContain("gemini-3.8-flash");
    const toolResult = JSON.stringify(requests[1].body.contents);
    expect(toolResult).toContain("Contact for pricing");
    expect(toolResult).not.toContain("90000");
  });

  it("sends the model's thought signature back with the tool result", async () => {
    const { client, requests } = await fakeApi([toolTurn(), textTurn("STOP")]);
    await collect(streamAnswer(db, question, client));
    expect(JSON.stringify(requests[1].body.contents)).toContain('"thoughtSignature":"signature"');
  });

  it("sends earlier assistant replies as model turns", async () => {
    const { client, requests } = await fakeApi([textTurn("STOP")]);
    const messages = [...question.messages, { role: "assistant" as const, content: "Hello" }, { role: "user" as const, content: "And?" }];
    await collect(streamAnswer(db, { ...question, messages }, client));
    const contents = requests[0].body.contents as { role: string }[];
    expect(contents.map(({ role }) => role)).toEqual(["user", "model", "user"]);
  });

  it("offers only the lookups and the unanswered flag", async () => {
    const { client, requests } = await fakeApi([textTurn("STOP")]);
    await collect(streamAnswer(db, question, client));
    const [{ functionDeclarations }] = requests[0].body.tools as { functionDeclarations: { name: string }[] }[];
    expect(functionDeclarations.map((tool) => tool.name).sort()).toEqual(["get_unit", "list_available_units", "note_unanswered"]);
  });

  it.each([
    ["a tool it was not offered", "delete_unit", {}, "Unknown tool"],
    ["invalid arguments", "get_unit", { slug: 5 }, "Invalid arguments"],
  ])("reports %s to the model", async (_name, tool, args, error) => {
    const { client, requests } = await fakeApi([toolTurn(tool, args), textTurn("STOP")]);
    await collect(streamAnswer(db, question, client));
    expect(JSON.stringify(requests[1].body.contents)).toContain(error);
  });

  it("tells the caller when the model flags a question as unanswered", async () => {
    const { client } = await fakeApi([toolTurn("note_unanswered"), textTurn("STOP")]);
    let flagged = false;
    await collect(streamAnswer(db, question, client, () => (flagged = true)));
    expect(flagged).toBe(true);
  });

  it("does not flag a question it can answer", async () => {
    const { client } = await fakeApi([toolTurn(), textTurn("STOP")]);
    let flagged = false;
    await collect(streamAnswer(db, question, client, () => (flagged = true)));
    expect(flagged).toBe(false);
  });

  it("treats a blocked answer as unavailable", async () => {
    const { client } = await fakeApi([textTurn("SAFETY")]);
    await expect(collect(streamAnswer(db, question, client))).rejects.toThrow("declined");
  });

  it("treats a blocked prompt as unavailable", async () => {
    const { client } = await fakeApi([sse([{ promptFeedback: { blockReason: "SAFETY" } }])]);
    await expect(collect(streamAnswer(db, question, client))).rejects.toThrow("declined");
  });

  it("treats an empty answer as unavailable", async () => {
    const { client } = await fakeApi([sse([modelTurn([], "STOP")])]);
    await expect(collect(streamAnswer(db, question, client))).rejects.toThrow("no answer");
  });

  it("stops after too many lookups", async () => {
    const { client, requests } = await fakeApi([toolTurn(), toolTurn(), toolTurn(), toolTurn(), toolTurn()]);
    await expect(collect(streamAnswer(db, question, client))).rejects.toThrow("too many");
    expect(requests).toHaveLength(4);
  });

  it("fails without retrying when the quota runs out", async () => {
    const { client, requests } = await fakeApi([JSON.stringify({ error: { code: 429, message: "quota", status: "RESOURCE_EXHAUSTED" } })], 429);
    await expect(collect(streamAnswer(db, question, client))).rejects.toThrow();
    expect(requests).toHaveLength(1);
  });
});
