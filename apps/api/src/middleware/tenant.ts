// Tenant middleware — sets PostgreSQL RLS context per request
// Phase 1 will implement:
// 1. Extract tenant (org) ID from authenticated session
// 2. SET LOCAL app.current_tenant = '<org_id>' on the DB connection
// 3. Ensures all queries are scoped to the current tenant via RLS policies

export {} // placeholder
