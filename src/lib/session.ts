import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { userForToken } from "@/server/auth";
import { ForbiddenError } from "@/server/errors";

export const SESSION_COOKIE = "adot_session";

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return userForToken(await getDb(), token);
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Shows denied staff the same page as a missing record, so a page never reveals that a record exists. */
export async function orNotFound<T>(load: () => T | Promise<T>) {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }
}
