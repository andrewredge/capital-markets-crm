CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"title" text,
	"linkedin_url" text,
	"source" text,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"entity_type" text NOT NULL,
	"website" text,
	"industry" text,
	"headquarters" text,
	"founded_year" integer,
	"employee_count_range" text,
	"investor_type" text,
	"aum" text,
	"investment_stage_focus" jsonb,
	"ticker_symbol" text,
	"exchange" text,
	"market_cap" text,
	"funding_stage" text,
	"total_funding" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "company_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"from_company_id" text NOT NULL,
	"to_company_id" text NOT NULL,
	"relationship_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contact_company_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"company_id" text NOT NULL,
	"role" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_company_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_from_company_id_companies_id_fk" FOREIGN KEY ("from_company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_to_company_id_companies_id_fk" FOREIGN KEY ("to_company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_company_roles" ADD CONSTRAINT "contact_company_roles_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_company_roles" ADD CONSTRAINT "contact_company_roles_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_company_roles" ADD CONSTRAINT "contact_company_roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "contacts_tenant_isolation" ON "contacts" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "contacts"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "companies_tenant_isolation" ON "companies" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "companies"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "company_relationships_tenant_isolation" ON "company_relationships" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "company_relationships"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "contact_company_roles_tenant_isolation" ON "contact_company_roles" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_tenant', true) = '' OR "contact_company_roles"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
ALTER POLICY "invitation_tenant_isolation" ON "invitation" TO public USING (current_setting('app.current_tenant', true) = '' OR "invitation"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
ALTER POLICY "member_tenant_isolation" ON "member" TO public USING (current_setting('app.current_tenant', true) = '' OR "member"."organization_id" = current_setting('app.current_tenant', true));--> statement-breakpoint
ALTER TABLE "contacts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "companies" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "company_relationships" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_company_roles" FORCE ROW LEVEL SECURITY;