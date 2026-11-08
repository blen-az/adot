"use client";

import {
  BotIcon,
  Building2Icon,
  ImageIcon,
  InboxIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  overview: LayoutDashboardIcon,
  units: Building2Icon,
  inbox: InboxIcon,
  assistant: BotIcon,
  images: ImageIcon,
  settings: SettingsIcon,
} satisfies Record<string, LucideIcon>;

export type NavItem = { href: string; label: string; icon: keyof typeof icons; count?: number };

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Dashboard">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
            {item.count ? (
              <span className="admin-nav-count" aria-label={`${item.count} new`}>
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
