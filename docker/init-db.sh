#!/bin/bash
# Creates the non-superuser application role (crm_app) used by the API server.
# Superusers bypass RLS — the app MUST connect as crm_app for tenant isolation.
# This script runs automatically when the Docker volume is first created.

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE crm_app LOGIN PASSWORD 'crm_app_password';
    GRANT CONNECT ON DATABASE crm_dev TO crm_app;
    GRANT USAGE ON SCHEMA public TO crm_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO crm_app;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO crm_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO crm_app;
EOSQL
