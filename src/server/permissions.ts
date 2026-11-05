import type { Role } from "@/db/schema";
import { ForbiddenError } from "./errors";

export type Permission =
  | "units.edit"
  | "units.availability"
  | "enquiries.read"
  | "enquiries.readAll"
  | "settings.manage";

const grants: Record<Role, Permission[]> = {
  administrator: ["units.edit", "units.availability", "enquiries.read", "enquiries.readAll", "settings.manage"],
  leasing_staff: ["units.edit", "units.availability", "enquiries.read"],
  content_editor: ["units.edit"],
};

export type Actor = { id: string; role: Role };

export function can(actor: Actor, permission: Permission) {
  return grants[actor.role].includes(permission);
}

export function assertCan(actor: Actor, permission: Permission) {
  if (!can(actor, permission)) throw new ForbiddenError();
}
