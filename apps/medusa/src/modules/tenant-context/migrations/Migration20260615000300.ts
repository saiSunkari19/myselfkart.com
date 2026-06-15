import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Phase 1 / seller-admin binding (Concern 1).
 *
 * Adds a tenant_id to the admin `user` table so a seller admin can be bound to
 * exactly one tenant. This is the durable source of truth for the binding; the
 * same tenant_id is also stamped into auth_identity.app_metadata at creation so
 * it rides into the admin JWT and is read by the /admin* tenant middleware with
 * no extra database round-trip.
 *
 * RLS on the `user` table itself (so sellers cannot enumerate each other's admin
 * accounts) is Concern 2 and intentionally NOT enabled here. The auth path never
 * reads the `user` table — authenticate() builds req.auth_context from the
 * JWT/session — so adding RLS later is safe, but it is a separate hardening step.
 */
export class Migration20260615000300 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "user" add column if not exists "tenant_id" uuid null;'
    )
    this.addSql(
      'create index if not exists "IDX_user_tenant_id" on "user" ("tenant_id");'
    )
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_user_tenant_id";')
    this.addSql('alter table if exists "user" drop column if exists "tenant_id";')
  }
}
