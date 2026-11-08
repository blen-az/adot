import type { Availability, EnquiryStatus, Publication, Role } from "@/db/schema";

export const roleLabels: Record<Role, string> = {
  administrator: "Administrator",
  leasing_staff: "Leasing staff",
  content_editor: "Content editor",
};

export const enquiryStatusLabels: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  viewing_arranged: "Viewing arranged",
  closed: "Closed",
  spam: "Spam",
};

export const publicationLabels: Record<Publication, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const availabilityLabels: Record<Availability, string> = {
  available: "Available",
  under_discussion: "Under discussion",
  leased: "Leased",
};

export const enquiryTypeLabels = {
  unit: "Unit enquiry",
  future_availability: "Future availability",
  gym: "Gym",
  general: "General",
} as const;

const zone = "Africa/Addis_Ababa";

export const formatWhen = (date: Date) =>
  date.toLocaleString("en-GB", { timeZone: zone, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** "5 min ago", "3 h ago", "2 days ago", then a date. */
export function timeAgo(date: Date, now = new Date()) {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-GB", { timeZone: zone, day: "numeric", month: "short" });
}

export function greeting(now = new Date()) {
  const hour = Number(now.toLocaleString("en-GB", { timeZone: zone, hour: "2-digit", hour12: false }));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
