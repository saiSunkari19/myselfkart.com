import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type LinkTablePolicy = {
  table: string
  ownerChecks: string[]
}

const CURRENT_TENANT_SQL =
  "nullif(current_setting('app.current_tenant', true), '')::uuid"

const LINK_TABLE_POLICIES: LinkTablePolicy[] = [
  {
    table: "cart_payment_collection",
    ownerChecks: [ownerExists("cart", "cart_id")],
  },
  {
    table: "cart_promotion",
    ownerChecks: [ownerExists("cart", "cart_id")],
  },
  {
    table: "customer_account_holder",
    ownerChecks: [ownerExists("customer", "customer_id")],
  },
  {
    table: "order_cart",
    ownerChecks: [ownerExists("order", "order_id"), ownerExists("cart", "cart_id")],
  },
  {
    table: "order_fulfillment",
    ownerChecks: [ownerExists("order", "order_id")],
  },
  {
    table: "order_payment_collection",
    ownerChecks: [ownerExists("order", "order_id")],
  },
  {
    table: "order_promotion",
    ownerChecks: [ownerExists("order", "order_id")],
  },
  {
    table: "return_fulfillment",
    ownerChecks: [ownerExists("return", "return_id")],
  },
  {
    table: "product_sales_channel",
    ownerChecks: [ownerExists("product", "product_id")],
  },
  {
    table: "product_shipping_profile",
    ownerChecks: [ownerExists("product", "product_id")],
  },
  {
    table: "product_variant_inventory_item",
    ownerChecks: [ownerExists("product_variant", "variant_id")],
  },
  {
    table: "product_variant_price_set",
    ownerChecks: [ownerExists("product_variant", "variant_id")],
  },
]

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

function ownerExists(ownerTable: string, linkColumn: string): string {
  return `exists (
    select 1
    from ${quoteIdent(ownerTable)} as owner_row
    where owner_row."id" = ${quoteIdent(linkColumn)}
    and owner_row."tenant_id" = ${CURRENT_TENANT_SQL}
  )`
}

async function tableExists(knex: any, table: string): Promise<boolean> {
  const result = await knex.raw(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
        and table_name = ?
      ) as exists
    `,
    [table]
  )

  return Boolean(result.rows?.[0]?.exists)
}

export default async function protectMedusaLinkTables({
  container,
}: ExecArgs): Promise<void> {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Applying Selfkart tenant RLS to Medusa link tables")

  for (const policy of LINK_TABLE_POLICIES) {
    if (!(await tableExists(knex, policy.table))) {
      logger.warn(`Skipping missing Medusa link table: ${policy.table}`)
      continue
    }

    const quotedTable = quoteIdent(policy.table)
    const policyName = quoteIdent(`${policy.table}_tenant_isolation`)
    const policyExpression = policy.ownerChecks.join("\n    and ")

    await knex.raw(`alter table ${quotedTable} enable row level security;`)
    await knex.raw(`alter table ${quotedTable} force row level security;`)
    await knex.raw(`drop policy if exists ${policyName} on ${quotedTable};`)
    await knex.raw(`
      create policy ${policyName}
      on ${quotedTable}
      for all
      using (${policyExpression})
      with check (${policyExpression});
    `)
  }

  await knex.raw(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
  await knex.raw(`grant usage, select on all sequences in schema public to medusa_app;`)

  logger.info("Selfkart tenant RLS applied to Medusa link tables")
}
