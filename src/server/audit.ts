import type { Db } from "@/db/client";
import { auditLog } from "@/db/schema";

type Entry = {
  actorId: string | null;
  action: string;
  entityType: "unit" | "enquiry" | "assistant_conversation";
  entityId: string;
  detail?: Record<string, unknown>;
};

export async function recordAudit(db: Pick<Db, "insert">, entry: Entry) {
  await db.insert(auditLog).values({ ...entry, detail: entry.detail ?? {} });
}
