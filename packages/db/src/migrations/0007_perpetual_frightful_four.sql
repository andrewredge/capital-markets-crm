CREATE TABLE "project_deals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"deal_id" text NOT NULL,
	"role" text DEFAULT 'subject_asset' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_deals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_deals" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"owner_company_id" text NOT NULL,
	"name" text NOT NULL,
	"project_status" text DEFAULT 'exploration' NOT NULL,
	"country" text,
	"state_province" text,
	"nearest_town" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"primary_commodity" text NOT NULL,
	"secondary_commodities" jsonb,
	"resource_estimate" text,
	"reserve_estimate" text,
	"reporting_standard" text,
	"tenure_type" text,
	"tenure_expiry" timestamp with time zone,
	"tenure_area" text,
	"capex_estimate" text,
	"npv" text,
	"irr" text,
	"description" text,
	"stage_of_study" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "taggings" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "project_deals" ADD CONSTRAINT "project_deals_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_deals" ADD CONSTRAINT "project_deals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_deals" ADD CONSTRAINT "project_deals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_company_id_companies_id_fk" FOREIGN KEY ("owner_company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "project_deals_tenant_isolation" ON "project_deals" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "project_deals"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "projects_tenant_isolation" ON "projects" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "projects"."organization_id" = current_setting('app.current_tenant', true));