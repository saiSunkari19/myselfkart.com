import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Phase 1 / seller-admin binding (Concern 2): tenant-isolate the admin identity
 * tables so one seller cannot enumerate another seller's admin users, invites,
 * or API keys.
 *
 * Reuses the Phase 0B "selfkart_set_tenant_id" trigger + the same
 * current_setting('app.current_tenant') policy as the commerce tables. This means
 * rows in these tables can only be created while a tenant context is active
 * (the seller-admin session sets it; create-seller-admin wraps provisioning in a
 * tenant context).
 *
 * auth_identity / provider_identity are deliberately NOT covered: login resolves
 * them by (provider, email) BEFORE any tenant is known, so forcing RLS there
 * would break authentication. Tenant lives in auth_identity.app_metadata instead.
 *
 * api_key is also deliberately NOT covered yet: Medusa creates a platform-level
 * "Default Publishable API Key" at boot with no tenant context, which the strict
 * trigger would reject. Scoping api_key needs a tenant-nullable model so the
 * platform default key can coexist with per-seller keys; deferred (Phase 1+).
 */
const IDENTITY_TENANT_TABLES = ["user", "invite"]

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

export class Migration20260615000400 extends Migration {
  async up(): Promise<void> {
    for (const table of IDENTITY_TENANT_TABLES) {
      const quotedTable = quoteIdent(table)
      const policyName = quoteIdent(`${table}_tenant_isolation`)
      const triggerName = quoteIdent(`trg_${table}_tenant_id`)
      const indexName = quoteIdent(`IDX_${table}_tenant_id`)

      this.addSql(`alter table if exists ${quotedTable} add column if not exists "tenant_id" uuid;`)
      this.addSql(`create index if not exists ${indexName} on ${quotedTable} ("tenant_id");`)
      this.addSql(`drop trigger if exists ${triggerName} on ${quotedTable};`)
      this.addSql(`
        create trigger ${triggerName}
        before insert or update of "tenant_id" on ${quotedTable}
        for each row
        execute function "selfkart_set_tenant_id"();
      `)
      this.addSql(`alter table if exists ${quotedTable} enable row level security;`)
      this.addSql(`alter table if exists ${quotedTable} force row level security;`)
      this.addSql(`drop policy if exists ${policyName} on ${quotedTable};`)
      this.addSql(`
        create policy ${policyName}
        on ${quotedTable}
        for all
        using ("tenant_id" = nullif(current_setting('app.current_tenant', true), '')::uuid)
        with check ("tenant_id" = nullif(current_setting('app.current_tenant', true), '')::uuid);
      `)
    }

    // Replace the global unique invite email index with a tenant-aware one so two
    // sellers can each invite the same email address.
    this.addSql(`drop index if exists "IDX_invite_email";`)
    this.addSql(`
      create unique index if not exists "IDX_invite_tenant_email_unique"
      on "invite" ("tenant_id", "email")
      where deleted_at is null;
    `)

    // medusa_app already holds DML on these tables (project-level grant); ensure
    // sequence usage for any identity sequences created since the Phase 0B grant.
    this.addSql(`grant usage, select on all sequences in schema public to medusa_app;`)
  }

  async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_invite_tenant_email_unique";`)
    this.addSql(`create unique index if not exists "IDX_invite_email" on "invite" (email) where deleted_at is null;`)

    for (const table of IDENTITY_TENANT_TABLES) {
      const quotedTable = quoteIdent(table)
      const policyName = quoteIdent(`${table}_tenant_isolation`)
      const triggerName = quoteIdent(`trg_${table}_tenant_id`)
      const indexName = quoteIdent(`IDX_${table}_tenant_id`)

      this.addSql(`drop policy if exists ${policyName} on ${quotedTable};`)
      this.addSql(`alter table if exists ${quotedTable} disable row level security;`)
      this.addSql(`drop trigger if exists ${triggerName} on ${quotedTable};`)
      this.addSql(`drop index if exists ${indexName};`)
      // tenant_id on "user" is owned by Migration20260615000300; only drop it for
      // invite/api_key which introduced it here.
      if (table !== "user") {
        this.addSql(`alter table if exists ${quotedTable} drop column if exists "tenant_id";`)
      }
    }
  }
}
