import { headers } from "next/headers";

/** Assumes the host's proxy sets x-forwarded-for. Confirm this when hosting is chosen (O-09). */
export async function clientAddress() {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
