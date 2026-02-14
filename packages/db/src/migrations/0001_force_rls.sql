-- Force RLS on tenant-scoped tables so policies apply even to table owner/superuser.
-- This is essential for development (where the DB user is often a superuser)
-- and provides defense-in-depth for production.
ALTER TABLE "member" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "invitation" FORCE ROW LEVEL SECURITY;
