import { getDb } from "@/db/client";
import { processNotifications } from "@/server/enquiries";
import { consoleMailer } from "@/server/mailer";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await processNotifications(await getDb(), consoleMailer);
  return new Response(null, { status: 204 });
}
