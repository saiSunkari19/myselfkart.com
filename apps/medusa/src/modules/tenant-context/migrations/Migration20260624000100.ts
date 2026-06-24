import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Rescope the customer email uniqueness to be per-tenant.
 *
 * The original tenant migration (Migration20260615000100) added tenant_id + RLS
 * to `customer` and rescoped the global unique indexes of every OTHER taxonomy
 * table (products, variants, tags, types, collections, categories, customer_group)
 * to include tenant_id — but it missed `customer` itself. So Medusa core's GLOBAL
 * index survived:
 *
 *   IDX_customer_email_has_account_unique  on (email, has_account) where deleted_at is null
 *
 * That global index means one email can hold an account on only ONE tenant. A
 * shopper who registered on store A (e.g. via Google) then signs into store B:
 * resolveTenantCustomerToken's RLS-scoped listCustomers can't see A's customer,
 * so it tries to createCustomers(has_account: true) under B and trips this global
 * unique index → Postgres 23505 → the broker /complete route 500s → the buyer is
 * stranded on the OAuth broker host. Other emails (never used elsewhere) succeed.
 *
 * Replace it with a tenant-scoped index so the same identity gets a separate
 * customer per store — exactly the model in src/api/store/auth/_lib/
 * resolve-tenant-customer.ts.
 *
 * Also finish the customer_group rescope that Migration20260615000100 started but
 * missed: it dropped "IDX_customer_group_name" (the name core used in older
 * versions) and created the tenant-scoped "IDX_customer_group_tenant_name_unique",
 * but the installed core actually ships the GLOBAL index as
 * "IDX_customer_group_name_unique" (@medusajs/customer Migration20240602110946),
 * so the drop was a no-op and the global name uniqueness survived — two sellers
 * couldn't share a customer-group name. Drop BOTH historic core names so only the
 * tenant-scoped index remains (a later core migration re-adds
 * "IDX_customer_group_name", so guard against both).
 */
export class Migration20260624000100 extends Migration {
  async up(): Promise<void> {
    this.addSql(`drop index if exists "IDX_customer_email_has_account_unique";`)
    this.addSql(`
      create unique index if not exists "IDX_customer_tenant_email_has_account_unique"
      on "customer" ("tenant_id", "email", "has_account")
      where deleted_at is null;
    `)

    this.addSql(`drop index if exists "IDX_customer_group_name_unique";`)
    this.addSql(`drop index if exists "IDX_customer_group_name";`)
    this.addSql(`
      create unique index if not exists "IDX_customer_group_tenant_name_unique"
      on "customer_group" ("tenant_id", "name")
      where deleted_at is null and name is not null;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_customer_tenant_email_has_account_unique";`)
    this.addSql(`
      create unique index if not exists "IDX_customer_email_has_account_unique"
      on "customer" ("email", "has_account")
      where deleted_at is null;
    `)

    // Restore the global core index name (current core version).
    this.addSql(`
      create unique index if not exists "IDX_customer_group_name_unique"
      on "customer_group" ("name")
      where deleted_at is null;
    `)
  }
}
