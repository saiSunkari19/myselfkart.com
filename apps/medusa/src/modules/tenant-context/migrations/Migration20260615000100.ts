import { Migration } from "@medusajs/framework/mikro-orm/migrations"

const TENANT_TABLES = [
  "cart",
  "cart_address",
  "cart_line_item",
  "cart_line_item_adjustment",
  "cart_line_item_tax_line",
  "cart_shipping_method",
  "cart_shipping_method_adjustment",
  "cart_shipping_method_tax_line",
  "credit_line",
  "customer",
  "customer_address",
  "customer_group",
  "customer_group_customer",
  "image",
  "order",
  "order_address",
  "order_change",
  "order_change_action",
  "order_claim",
  "order_claim_item",
  "order_claim_item_image",
  "order_credit_line",
  "order_exchange",
  "order_exchange_item",
  "order_item",
  "order_line_item",
  "order_line_item_adjustment",
  "order_line_item_tax_line",
  "order_shipping",
  "order_shipping_method",
  "order_shipping_method_adjustment",
  "order_shipping_method_tax_line",
  "order_summary",
  "order_transaction",
  "product",
  "product_category",
  "product_category_product",
  "product_collection",
  "product_option",
  "product_option_value",
  "product_tag",
  "product_tags",
  "product_type",
  "product_variant",
  "product_variant_option",
  "product_variant_product_image",
  "return",
  "return_item",
  "return_reason",
]

const TENANT_UNIQUE_INDEXES = [
  {
    table: "product",
    oldName: "IDX_product_handle_unique",
    newName: "IDX_product_tenant_handle_unique",
    columns: ["tenant_id", "handle"],
    where: "deleted_at is null",
  },
  {
    table: "product_variant",
    oldName: "IDX_product_variant_sku_unique",
    newName: "IDX_product_variant_tenant_sku_unique",
    columns: ["tenant_id", "sku"],
    where: "deleted_at is null and sku is not null",
  },
  {
    table: "product_variant",
    oldName: "IDX_product_variant_barcode_unique",
    newName: "IDX_product_variant_tenant_barcode_unique",
    columns: ["tenant_id", "barcode"],
    where: "deleted_at is null and barcode is not null",
  },
  {
    table: "product_variant",
    oldName: "IDX_product_variant_ean_unique",
    newName: "IDX_product_variant_tenant_ean_unique",
    columns: ["tenant_id", "ean"],
    where: "deleted_at is null and ean is not null",
  },
  {
    table: "product_variant",
    oldName: "IDX_product_variant_upc_unique",
    newName: "IDX_product_variant_tenant_upc_unique",
    columns: ["tenant_id", "upc"],
    where: "deleted_at is null and upc is not null",
  },
  {
    table: "product_tag",
    oldName: "IDX_tag_value_unique",
    newName: "IDX_product_tag_tenant_value_unique",
    columns: ["tenant_id", "value"],
    where: "deleted_at is null",
  },
  {
    table: "product_type",
    oldName: "IDX_type_value_unique",
    newName: "IDX_product_type_tenant_value_unique",
    columns: ["tenant_id", "value"],
    where: "deleted_at is null",
  },
  {
    table: "product_collection",
    oldName: "IDX_collection_handle_unique",
    newName: "IDX_product_collection_tenant_handle_unique",
    columns: ["tenant_id", "handle"],
    where: "deleted_at is null",
  },
  {
    table: "product_category",
    oldName: "IDX_category_handle_unique",
    newName: "IDX_product_category_tenant_handle_unique",
    columns: ["tenant_id", "handle"],
    where: "deleted_at is null",
  },
  {
    table: "customer_group",
    oldName: "IDX_customer_group_name",
    newName: "IDX_customer_group_tenant_name_unique",
    columns: ["tenant_id", "name"],
    where: "deleted_at is null and name is not null",
  },
]

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

function columnsSql(columns: string[]): string {
  return columns.map(quoteIdent).join(", ")
}

export class Migration20260615000100 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      create or replace function "selfkart_set_tenant_id"()
      returns trigger
      language plpgsql
      as $$
      declare
        current_tenant uuid;
      begin
        current_tenant := nullif(current_setting('app.current_tenant', true), '')::uuid;

        if current_tenant is null then
          raise exception 'app.current_tenant is required for tenant-scoped table %', TG_TABLE_NAME;
        end if;

        if TG_OP = 'INSERT' then
          if NEW.tenant_id is null then
            NEW.tenant_id := current_tenant;
          end if;

          if NEW.tenant_id is distinct from current_tenant then
            raise exception 'tenant_id must match app.current_tenant for table %', TG_TABLE_NAME;
          end if;
        elsif TG_OP = 'UPDATE' and NEW.tenant_id is distinct from OLD.tenant_id then
          raise exception 'tenant_id cannot be changed for table %', TG_TABLE_NAME;
        end if;

        return NEW;
      end;
      $$;
    `)

    for (const table of TENANT_TABLES) {
      const quotedTable = quoteIdent(table)
      const policyName = quoteIdent(`${table}_tenant_isolation`)
      const triggerName = quoteIdent(`trg_${table}_tenant_id`)

      this.addSql(`alter table if exists ${quotedTable} add column if not exists "tenant_id" uuid;`)
      this.addSql(`create index if not exists ${quoteIdent(`IDX_${table}_tenant_id`)} on ${quotedTable} ("tenant_id");`)
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

    for (const index of TENANT_UNIQUE_INDEXES) {
      this.addSql(`drop index if exists ${quoteIdent(index.oldName)};`)
      this.addSql(`
        create unique index if not exists ${quoteIdent(index.newName)}
        on ${quoteIdent(index.table)} (${columnsSql(index.columns)})
        where ${index.where};
      `)
    }

    this.addSql(`grant usage on schema public to medusa_app;`)
    this.addSql(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
    this.addSql(`grant usage, select on all sequences in schema public to medusa_app;`)
  }

  async down(): Promise<void> {
    for (const index of TENANT_UNIQUE_INDEXES) {
      this.addSql(`drop index if exists ${quoteIdent(index.newName)};`)
    }

    this.addSql(`create unique index if not exists "IDX_product_handle_unique" on "product" ("handle") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_product_variant_sku_unique" on "product_variant" ("sku") where deleted_at is null and sku is not null;`)
    this.addSql(`create unique index if not exists "IDX_product_variant_barcode_unique" on "product_variant" ("barcode") where deleted_at is null and barcode is not null;`)
    this.addSql(`create unique index if not exists "IDX_product_variant_ean_unique" on "product_variant" ("ean") where deleted_at is null and ean is not null;`)
    this.addSql(`create unique index if not exists "IDX_product_variant_upc_unique" on "product_variant" ("upc") where deleted_at is null and upc is not null;`)
    this.addSql(`create unique index if not exists "IDX_tag_value_unique" on "product_tag" ("value") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_type_value_unique" on "product_type" ("value") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_collection_handle_unique" on "product_collection" ("handle") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_category_handle_unique" on "product_category" ("handle") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_customer_group_name" on "customer_group" ("name") where deleted_at is null and name is not null;`)

    for (const table of TENANT_TABLES) {
      const quotedTable = quoteIdent(table)
      const policyName = quoteIdent(`${table}_tenant_isolation`)
      const triggerName = quoteIdent(`trg_${table}_tenant_id`)

      this.addSql(`drop policy if exists ${policyName} on ${quotedTable};`)
      this.addSql(`alter table if exists ${quotedTable} disable row level security;`)
      this.addSql(`drop trigger if exists ${triggerName} on ${quotedTable};`)
      this.addSql(`drop index if exists ${quoteIdent(`IDX_${table}_tenant_id`)};`)
      this.addSql(`alter table if exists ${quotedTable} drop column if exists "tenant_id";`)
    }

    this.addSql(`drop function if exists "selfkart_set_tenant_id"();`)
  }
}
