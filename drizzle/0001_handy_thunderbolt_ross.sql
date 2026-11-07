CREATE TYPE "public"."assistant_outcome" AS ENUM('answered', 'unanswered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."enquiry_source" AS ENUM('website', 'assistant');--> statement-breakpoint
CREATE TABLE "assistant_conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"outcome" "assistant_outcome" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "source" "enquiry_source" DEFAULT 'website' NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "assistant_conversation_id" uuid;--> statement-breakpoint
ALTER TABLE "assistant_exchanges" ADD CONSTRAINT "assistant_exchanges_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assistant_conversations_recent_idx" ON "assistant_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "assistant_exchanges_conversation_idx" ON "assistant_exchanges" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "assistant_exchanges_recent_idx" ON "assistant_exchanges" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assistant_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("assistant_conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE set null ON UPDATE no action;