CREATE TABLE "contact_staleness" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"staleness_score" real DEFAULT 0 NOT NULL,
	"staleness_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_verified_at" timestamp with time zone,
	"last_verified_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_staleness" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "enrichment_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"source" text NOT NULL,
	"proposed_changes" jsonb NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"accepted_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrichment_proposals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "contact_type" text DEFAULT 'person' NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "contact_subtype" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "listing_status" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "entity_subtype" text;--> statement-breakpoint
ALTER TABLE "contact_staleness" ADD CONSTRAINT "contact_staleness_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_staleness" ADD CONSTRAINT "contact_staleness_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_proposals" ADD CONSTRAINT "enrichment_proposals_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_proposals" ADD CONSTRAINT "enrichment_proposals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_staleness_contact_id_unique" ON "contact_staleness" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "enrichment_proposals_contact_id_idx" ON "enrichment_proposals" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "enrichment_proposals_org_status_idx" ON "enrichment_proposals" USING btree ("organization_id", "review_status");--> statement-breakpoint
CREATE POLICY "contact_staleness_tenant_isolation" ON "contact_staleness" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "contact_staleness"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "enrichment_proposals_tenant_isolation" ON "enrichment_proposals" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "enrichment_proposals"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
ALTER TABLE "contact_staleness" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enrichment_proposals" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "contact_staleness_org_score_idx" ON "contact_staleness" USING btree ("organization_id", "staleness_score" DESC);