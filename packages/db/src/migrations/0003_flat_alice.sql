CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text,
	"company_id" text,
	"deal_id" text,
	"activity_type" text NOT NULL,
	"subject" text,
	"description" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text,
	"company_id" text,
	"deal_id" text,
	"title" text,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "taggings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"contact_id" text,
	"company_id" text,
	"deal_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "taggings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "activities_tenant_isolation" ON "activities" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "activities"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "notes_tenant_isolation" ON "notes" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "notes"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "taggings_tenant_isolation" ON "taggings" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "taggings"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "tags_tenant_isolation" ON "tags" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "tags"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
ALTER TABLE "activities" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notes" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "taggings" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tags" FORCE ROW LEVEL SECURITY;