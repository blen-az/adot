import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["administrator", "content_editor", "leasing_staff"]);
export const publicationEnum = pgEnum("publication_status", ["draft", "published", "archived"]);
export const availabilityEnum = pgEnum("availability_status", ["available", "under_discussion", "leased"]);
export const billingPeriodEnum = pgEnum("billing_period", ["monthly", "quarterly", "annual"]);
export const enquiryTypeEnum = pgEnum("enquiry_type", ["unit", "future_availability", "gym", "general"]);
export const enquiryStatusEnum = pgEnum("enquiry_status", ["new", "contacted", "viewing_arranged", "closed", "spam"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sending", "sent", "failed"]);
export const enquirySourceEnum = pgEnum("enquiry_source", ["website", "assistant"]);
export const assistantOutcomeEnum = pgEnum("assistant_outcome", ["answered", "unanswered", "failed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    reference: text("reference").notNull(),
    floor: text("floor").notNull(),
    category: text("category").notNull(),
    areaM2: numeric("area_m2", { precision: 10, scale: 2 }),
    titleEn: text("title_en").notNull(),
    titleAm: text("title_am").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionAm: text("description_am").notNull().default(""),
    permittedUseEn: text("permitted_use_en").notNull().default(""),
    permittedUseAm: text("permitted_use_am").notNull().default(""),
    featuresEn: text("features_en").array().notNull().default(sql`'{}'::text[]`),
    featuresAm: text("features_am").array().notNull().default(sql`'{}'::text[]`),
    rentEtb: numeric("rent_etb", { precision: 12, scale: 2 }),
    billingPeriod: billingPeriodEnum("billing_period"),
    serviceChargeEtb: numeric("service_charge_etb", { precision: 12, scale: 2 }),
    rentPublic: boolean("rent_public").notNull().default(false),
    availableFrom: date("available_from"),
    publication: publicationEnum("publication").notNull().default("draft"),
    availability: availabilityEnum("availability").notNull().default("available"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("units_public_idx").on(t.publication, t.availability)],
);

export const unitMedia = pgTable(
  "unit_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    altEn: text("alt_en").notNull().default(""),
    altAm: text("alt_am").notNull().default(""),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("unit_media_unit_idx").on(t.unitId, t.position)],
);

export const assistantConversations = pgTable(
  "assistant_conversations",
  {
    id: uuid("id").primaryKey(),
    locale: text("locale").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("assistant_conversations_recent_idx").on(t.lastMessageAt)],
);

export const assistantExchanges = pgTable(
  "assistant_exchanges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => assistantConversations.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull().default(""),
    outcome: assistantOutcomeEnum("outcome").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("assistant_exchanges_conversation_idx").on(t.conversationId, t.createdAt),
    index("assistant_exchanges_recent_idx").on(t.createdAt),
  ],
);

export type UnitSnapshot = { title: string; reference: string; floor: string };

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    idempotencyKey: uuid("idempotency_key").notNull().unique(),
    type: enquiryTypeEnum("type").notNull(),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    unitSnapshot: jsonb("unit_snapshot").$type<UnitSnapshot>(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    company: text("company"),
    preferredDate: date("preferred_date"),
    contactMethod: text("contact_method"),
    intendedUse: text("intended_use").notNull(),
    desiredArea: text("desired_area"),
    message: text("message").notNull(),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    locale: text("locale").notNull(),
    source: enquirySourceEnum("source").notNull().default("website"),
    assistantConversationId: uuid("assistant_conversation_id").references(() => assistantConversations.id, {
      onDelete: "set null",
    }),
    status: enquiryStatusEnum("status").notNull().default("new"),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("enquiries_inbox_idx").on(t.status, t.createdAt)],
);

export const enquiryNotes = pgTable("enquiry_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  enquiryId: uuid("enquiry_id")
    .notNull()
    .references(() => enquiries.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationAttempts = pgTable(
  "notification_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enquiryId: uuid("enquiry_id")
      .notNull()
      .references(() => enquiries.id, { onDelete: "cascade" }),
    recipient: text("recipient").notNull(),
    status: notificationStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("notification_once_idx").on(t.enquiryId, t.recipient)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_entity_idx").on(t.entityType, t.entityId)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export type User = typeof users.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type UnitMedia = typeof unitMedia.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type EnquiryStatus = (typeof enquiryStatusEnum.enumValues)[number];
export type EnquirySource = (typeof enquirySourceEnum.enumValues)[number];
export type AssistantOutcome = (typeof assistantOutcomeEnum.enumValues)[number];
export type Availability = (typeof availabilityEnum.enumValues)[number];
export type Publication = (typeof publicationEnum.enumValues)[number];
