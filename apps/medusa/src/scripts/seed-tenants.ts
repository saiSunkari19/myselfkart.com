import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import type { Knex } from "knex"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

type TenantSeed = {
  id: string
  tenantId: string
  products: {
    id: string
    title: string
    handle: string
    variantId: string
    inventoryItemId: string
    sku: string
  }[]
  customer: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  cart: {
    id: string
    email: string
  }
  order: {
    id: string
    email: string
    displayId: number
  }
}

const TENANT_SEEDS: TenantSeed[] = [
  {
    id: "a",
    tenantId: TENANT_A,
    products: [
      {
        id: "prod_selfkart_rls_a_shared",
        title: "Selfkart RLS Shared Product A",
        handle: "selfkart-rls-shared",
        variantId: "variant_selfkart_rls_a_shared",
        inventoryItemId: "iitem_selfkart_rls_a_shared",
        sku: "selfkart-rls-a-shared",
      },
      {
        id: "prod_selfkart_rls_a_only",
        title: "Selfkart RLS Tenant A Product",
        handle: "selfkart-rls-tenant-a-only",
        variantId: "variant_selfkart_rls_a_only",
        inventoryItemId: "iitem_selfkart_rls_a_only",
        sku: "selfkart-rls-a-only",
      },
    ],
    customer: {
      id: "cus_selfkart_rls_a",
      email: "tenant-a@example.selfkart.test",
      firstName: "Tenant",
      lastName: "A",
    },
    cart: {
      id: "cart_selfkart_rls_a",
      email: "tenant-a@example.selfkart.test",
    },
    order: {
      id: "order_selfkart_rls_a",
      email: "tenant-a@example.selfkart.test",
      displayId: 990001,
    },
  },
  {
    id: "b",
    tenantId: TENANT_B,
    products: [
      {
        id: "prod_selfkart_rls_b_shared",
        title: "Selfkart RLS Shared Product B",
        handle: "selfkart-rls-shared",
        variantId: "variant_selfkart_rls_b_shared",
        inventoryItemId: "iitem_selfkart_rls_b_shared",
        sku: "selfkart-rls-b-shared",
      },
      {
        id: "prod_selfkart_rls_b_only",
        title: "Selfkart RLS Tenant B Product",
        handle: "selfkart-rls-tenant-b-only",
        variantId: "variant_selfkart_rls_b_only",
        inventoryItemId: "iitem_selfkart_rls_b_only",
        sku: "selfkart-rls-b-only",
      },
    ],
    customer: {
      id: "cus_selfkart_rls_b",
      email: "tenant-b@example.selfkart.test",
      firstName: "Tenant",
      lastName: "B",
    },
    cart: {
      id: "cart_selfkart_rls_b",
      email: "tenant-b@example.selfkart.test",
    },
    order: {
      id: "order_selfkart_rls_b",
      email: "tenant-b@example.selfkart.test",
      displayId: 990002,
    },
  },
]

async function upsertRecord(
  trx: Knex.Transaction,
  tableName: string,
  record: Record<string, unknown>
) {
  await trx(tableName)
    .insert(record)
    .onConflict("id")
    .merge({
      ...record,
      updated_at: trx.fn.now(),
    })
}

async function upsertVariantInventoryLink(
  trx: Knex.Transaction,
  record: {
    id: string
    variant_id: string
    inventory_item_id: string
    required_quantity: number
  }
) {
  await trx("product_variant_inventory_item")
    .insert(record)
    .onConflict(["variant_id", "inventory_item_id"])
    .merge({
      id: record.id,
      required_quantity: record.required_quantity,
      updated_at: trx.fn.now(),
    })
}

async function seedTenant(trx: Knex.Transaction, seed: TenantSeed) {
  await trx.raw("select set_config('app.current_tenant', ?, true)", [seed.tenantId])

  for (const product of seed.products) {
    await upsertRecord(trx, "product", {
      id: product.id,
      title: product.title,
      handle: product.handle,
      subtitle: null,
      description: `Phase 0B RLS smoke fixture for tenant ${seed.id.toUpperCase()}`,
      is_giftcard: false,
      discountable: true,
      status: "published",
      metadata: JSON.stringify({
        fixture: "phase0b-rls",
        tenant: seed.id,
      }),
    })

    await upsertRecord(trx, "product_variant", {
      id: product.variantId,
      title: `${product.title} Default Variant`,
      sku: product.sku,
      barcode: null,
      ean: null,
      upc: null,
      allow_backorder: false,
      manage_inventory: true,
      product_id: product.id,
      metadata: JSON.stringify({
        fixture: "phase0b-rls",
        tenant: seed.id,
      }),
    })

    await upsertRecord(trx, "inventory_item", {
      id: product.inventoryItemId,
      sku: product.sku,
      requires_shipping: true,
      title: `${product.title} Inventory`,
      description: `Phase 0B RLS inventory fixture for tenant ${seed.id.toUpperCase()}`,
      metadata: JSON.stringify({
        fixture: "phase0b-rls",
        tenant: seed.id,
      }),
    })

    await upsertVariantInventoryLink(trx, {
      id: `pvii_selfkart_rls_${seed.id}_${product.inventoryItemId.replace(/^iitem_selfkart_rls_/, "")}`,
      variant_id: product.variantId,
      inventory_item_id: product.inventoryItemId,
      required_quantity: 1,
    })
  }

  await upsertRecord(trx, "customer", {
    id: seed.customer.id,
    company_name: null,
    first_name: seed.customer.firstName,
    last_name: seed.customer.lastName,
    email: seed.customer.email,
    phone: null,
    has_account: false,
    metadata: JSON.stringify({
      fixture: "phase0b-rls",
      tenant: seed.id,
    }),
  })

  await upsertRecord(trx, "cart", {
    id: seed.cart.id,
    email: seed.cart.email,
    currency_code: "usd",
    metadata: JSON.stringify({
      fixture: "phase0b-rls",
      tenant: seed.id,
    }),
  })

  await upsertRecord(trx, "order", {
    id: seed.order.id,
    display_id: seed.order.displayId,
    email: seed.order.email,
    currency_code: "usd",
    status: "pending",
    metadata: JSON.stringify({
      fixture: "phase0b-rls",
      tenant: seed.id,
    }),
  })
}

export default async function seedTenants({ container }: ExecArgs) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  await knex.transaction(async (trx) => {
    for (const seed of TENANT_SEEDS) {
      await seedTenant(trx, seed)
    }
  })

  logger.info("Seeded Phase 0B tenant RLS fixtures")
}
