import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getDb } from "@/db/client";
import { roleLabels } from "@/lib/admin-labels";
import { requireUser } from "@/lib/session";
import { newEnquiryCount } from "@/server/enquiries";
import { can } from "@/server/permissions";
import { logoutAction } from "../actions";
import { AdminNav, type NavItem } from "./AdminNav";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const newEnquiries = can(user, "enquiries.read") ? await newEnquiryCount(await getDb(), user) : 0;
  const items: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "overview" },
    { href: "/admin/units", label: "Units", icon: "units" },
    ...(can(user, "enquiries.read")
      ? [{ href: "/admin/inbox", label: "Inbox", icon: "inbox", count: newEnquiries } as const]
      : []),
    ...(can(user, "content.edit") ? [{ href: "/admin/images", label: "Site images", icon: "images" } as const] : []),
    ...(can(user, "assistant.review") ? [{ href: "/admin/assistant", label: "Ask Adot", icon: "assistant" } as const] : []),
    ...(can(user, "settings.manage") ? [{ href: "/admin/settings", label: "Settings", icon: "settings" } as const] : []),
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <img src="/assets/logos/adot-wordmark.svg" alt="Adot" width={72} height={24} />
          <span>Dashboard</span>
        </Link>
        <AdminNav items={items} />
        <div className="admin-user">
          <a className="admin-site-link" href="/en" target="_blank" rel="noreferrer">
            <ExternalLinkIcon aria-hidden="true" />
            View public site
          </a>
          <div className="admin-user-card">
            <span className="admin-avatar" aria-hidden="true">
              {user.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="admin-user-name">
              <strong>{user.name}</strong>
              <span>{roleLabels[user.role]}</span>
            </span>
            <form action={logoutAction}>
              <button type="submit" className="admin-icon-button" aria-label="Sign out" title="Sign out">
                <LogOutIcon aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
