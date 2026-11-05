import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { can } from "@/server/permissions";

export default async function AdminHome() {
  const user = await requireUser();
  redirect(can(user, "enquiries.read") ? "/admin/inbox" : "/admin/units");
}
