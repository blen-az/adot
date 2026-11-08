import {
  ArrowRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  ImageIcon,
  MailWarningIcon,
  MessageCircleQuestionIcon,
  PlusIcon,
  TriangleAlertIcon,
  UserRoundXIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { enquiryStatusLabels, enquiryTypeLabels, greeting, roleLabels, timeAgo } from "@/lib/admin-labels";
import { requireUser } from "@/lib/session";
import { assistantStats } from "@/server/assistant-log";
import { enquirySummary } from "@/server/enquiries";
import { can } from "@/server/permissions";
import { getSiteImages, siteImageSlots } from "@/server/site-images";
import { unitSummary } from "@/server/units";

export const metadata = { title: "Overview" };

function Stat({ label, value, href, hint }: { label: string; value: number; href: string; hint?: string }) {
  return (
    <Link className="stat-tile" href={href}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value.toLocaleString("en-GB")}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </Link>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="dash-panel">
      <header>
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

type Todo = { icon: LucideIcon; tone: "critical" | "warning"; label: string; detail?: string; href: string };

export default async function OverviewPage() {
  const user = await requireUser();
  const db = await getDb();
  const units = await unitSummary(db, user);
  const enquiries = can(user, "enquiries.read") ? await enquirySummary(db, user) : null;
  const ask = can(user, "assistant.review") ? await assistantStats(db, user) : null;
  const images = can(user, "content.edit") ? await getSiteImages(db) : null;

  const live = (units.byAvailability.available ?? 0) + (units.byAvailability.under_discussion ?? 0);
  const todos: Todo[] = [];
  if (enquiries?.failedNotifications) {
    todos.push({
      icon: MailWarningIcon,
      tone: "critical",
      label: `${enquiries.failedNotifications} enquir${enquiries.failedNotifications === 1 ? "y" : "ies"} with a failed staff notification`,
      detail: "Open the enquiry to retry the email.",
      href: "/admin/inbox",
    });
  }
  if (enquiries?.unassigned) {
    todos.push({
      icon: UserRoundXIcon,
      tone: "warning",
      label: `${enquiries.unassigned} open enquir${enquiries.unassigned === 1 ? "y has" : "ies have"} no assignee`,
      href: "/admin/inbox",
    });
  }
  if (ask?.totals.unanswered) {
    todos.push({
      icon: MessageCircleQuestionIcon,
      tone: "warning",
      label: `Ask Adot couldn't answer ${ask.totals.unanswered} question${ask.totals.unanswered === 1 ? "" : "s"} this week`,
      detail: "Adding an approved FAQ in Settings can cover them.",
      href: "/admin/assistant?show=unanswered",
    });
  }
  for (const { unit, issues, warnings } of units.attention.slice(0, 6)) {
    todos.push({
      icon: issues.length ? CircleAlertIcon : TriangleAlertIcon,
      tone: issues.length ? "critical" : "warning",
      label: `${unit.titleEn || unit.reference}: ${issues.length ? "can't be published yet" : "translation incomplete"}`,
      detail: [...issues, ...warnings].join(". "),
      href: `/admin/units/${unit.id}`,
    });
  }

  const firstName = user.name.split(" ")[0];
  return (
    <>
      <div className="dash-head">
        <div>
          <p className="dash-eyebrow">{roleLabels[user.role]}</p>
          <h1>
            {greeting()}, {firstName}
          </h1>
          <p className="hint">Here&apos;s what&apos;s happening at Adot Complex.</p>
        </div>
        <div className="actions">
          <Link className={buttonVariants({ size: "sm" })} href="/admin/units/new">
            <PlusIcon data-icon="inline-start" />
            New unit
          </Link>
          <a className={buttonVariants({ size: "sm", variant: "outline" })} href="/en" target="_blank" rel="noreferrer">
            <ExternalLinkIcon data-icon="inline-start" />
            Public site
          </a>
        </div>
      </div>

      {enquiries && (
        <section aria-labelledby="enquiry-stats">
          <h2 className="dash-section" id="enquiry-stats">
            Enquiries
          </h2>
          <div className="stat-grid">
            <Stat label="New" value={enquiries.byStatus.new ?? 0} href="/admin/inbox?status=new" hint="Not yet contacted" />
            <Stat label="Open" value={enquiries.open} href="/admin/inbox" hint="New, contacted or viewing" />
            <Stat label="Last 7 days" value={enquiries.lastWeek} href="/admin/inbox" hint="Received this week" />
            <Stat label="Unassigned" value={enquiries.unassigned} href="/admin/inbox" hint="Open with no owner" />
          </div>
        </section>
      )}

      <section aria-labelledby="unit-stats">
        <h2 className="dash-section" id="unit-stats">
          Units
        </h2>
        <div className="stat-grid">
          <Stat label="Live on site" value={live} href="/admin/units" hint="Published and visible" />
          <Stat label="Drafts" value={units.byPublication.draft ?? 0} href="/admin/units" hint="Not public yet" />
          <Stat label="Leased" value={units.byAvailability.leased ?? 0} href="/admin/units" hint="Published, now taken" />
          <Stat label="All units" value={units.total} href="/admin/units" hint={`${units.byPublication.archived ?? 0} archived`} />
        </div>
      </section>

      {ask && (
        <section aria-labelledby="ask-stats">
          <h2 className="dash-section" id="ask-stats">
            Ask Adot, last {ask.windowDays} days
          </h2>
          <div className="stat-grid">
            <Stat label="Conversations" value={ask.conversations} href="/admin/assistant" />
            <Stat label="Questions" value={ask.totals.questions} href="/admin/assistant" />
            <Stat label="Couldn't answer" value={ask.totals.unanswered} href="/admin/assistant?show=unanswered" />
            <Stat label="Leads" value={ask.leads} href="/admin/inbox?source=assistant" hint="Visitors who left details" />
          </div>
        </section>
      )}

      <div className="dash-columns">
        <Panel title="Needs attention">
          {todos.length === 0 ? (
            <p className="todo-clear">
              <CircleCheckIcon aria-hidden="true" />
              All clear. Nothing needs action right now.
            </p>
          ) : (
            <ul className="todo-list">
              {todos.map((todo) => (
                <li key={todo.label}>
                  <Link href={todo.href} data-tone={todo.tone}>
                    <todo.icon aria-hidden="true" />
                    <span>
                      <span className="sr-only">{todo.tone === "critical" ? "Action needed: " : "Warning: "}</span>
                      <strong>{todo.label}</strong>
                      {todo.detail && <span className="todo-detail">{todo.detail}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {enquiries && (
          <Panel
            title="Recent enquiries"
            action={
              <Link className="dash-link" href="/admin/inbox">
                View inbox <ArrowRightIcon aria-hidden="true" />
              </Link>
            }
          >
            {enquiries.recent.length === 0 ? (
              <p className="hint">No enquiries yet. They appear here as soon as a visitor sends one.</p>
            ) : (
              <ul className="recent-list">
                {enquiries.recent.map((enquiry) => (
                  <li key={enquiry.id}>
                    <Link href={`/admin/inbox/${enquiry.id}`}>
                      <span className="recent-main">
                        <strong>{enquiry.name}</strong>
                        <span>
                          {enquiry.unitSnapshot?.title ?? enquiryTypeLabels[enquiry.type]}
                          {enquiry.source === "assistant" && " · via Ask Adot"}
                        </span>
                      </span>
                      <span className="recent-side">
                        <Badge variant={enquiry.status === "new" ? "default" : "outline"}>
                          {enquiryStatusLabels[enquiry.status]}
                        </Badge>
                        <span className="hint">{timeAgo(enquiry.createdAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {images && (
          <Panel
            title="Site images"
            action={
              <Link className="dash-link" href="/admin/images">
                Manage <ArrowRightIcon aria-hidden="true" />
              </Link>
            }
          >
            <p className="hint">
              {Object.values(images).filter((image) => image.custom).length} of {Object.keys(siteImageSlots).length}{" "}
              public-site photos replaced with uploads.
            </p>
            <ul className="thumb-strip">
              {Object.values(images).map((image) => (
                <li key={image.slot}>
                  <Link href={`/admin/images#${image.slot}`} title={siteImageSlots[image.slot].label}>
                    <img src={image.cardSrc} alt={siteImageSlots[image.slot].label} loading="lazy" />
                  </Link>
                </li>
              ))}
              <li>
                <Link className="thumb-add" href="/admin/images" aria-label="Manage site images">
                  <ImageIcon aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
