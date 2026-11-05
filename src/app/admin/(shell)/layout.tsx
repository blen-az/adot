import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";
import { can } from "@/server/permissions";
import { logoutAction } from "../actions";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="admin-header">
        <div className="container">
          <strong>Adot dashboard</strong>
          <Link href="/admin/units">Units</Link>
          {can(user, "enquiries.read") && <Link href="/admin/inbox">Inbox</Link>}
          {can(user, "settings.manage") && <Link href="/admin/settings">Settings</Link>}
          <span className="spacer">{user.name}</span>
          <form action={logoutAction}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
