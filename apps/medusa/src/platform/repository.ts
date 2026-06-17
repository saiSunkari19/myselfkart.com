import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"

import type { Knex } from "knex"

/**
 * Thin knex data-access for the platform (superadmin) tables. All three tables
 * are non-RLS platform tables (see migration 20260616000400), so these queries
 * run WITHOUT a tenant context — the operator works across every tenant.
 */

export type PlatformAdmin = {
  id: string
  email: string
  name: string
  password_hash: string
  role: "owner" | "operator"
  disabled_at: string | null
}

export type SellerApplication = {
  id: string
  store_name: string
  owner_name: string
  owner_email: string
  desired_subdomain: string
  country: string
  currency: string
  phone: string | null
  notes: string | null
  status: "pending" | "approved" | "provisioning" | "active" | "rejected" | "failed"
  tenant_id: string | null
  host: string | null
  provisioning_error: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Derives the storefront host for a seller subdomain. Configurable so dev uses
 * `*.localhost` and prod uses the real apex (e.g. `seller.selfkart.com`).
 */
export function hostForSubdomain(subdomain: string): string {
  const base = (process.env.SELFKART_STOREFRONT_BASE_DOMAIN || "localhost")
    .trim()
    .toLowerCase()
  return `${subdomain}.${base}`
}

// --- platform_admins ---------------------------------------------------------

export async function findAdminByEmail(
  knex: Knex,
  email: string
): Promise<PlatformAdmin | undefined> {
  return knex<PlatformAdmin>("platform_admins")
    .whereRaw("lower(email) = ?", [email])
    .first()
}

export async function findAdminById(
  knex: Knex,
  id: string
): Promise<PlatformAdmin | undefined> {
  return knex<PlatformAdmin>("platform_admins").where({ id }).first()
}

export async function insertAdmin(
  knex: Knex,
  admin: Pick<PlatformAdmin, "id" | "email" | "name" | "password_hash" | "role">
): Promise<void> {
  await knex("platform_admins")
    .insert({ ...admin, updated_at: knex.fn.now() })
    .onConflict(knex.raw("(lower(email))"))
    .merge({
      name: admin.name,
      password_hash: admin.password_hash,
      role: admin.role,
      disabled_at: null,
      updated_at: knex.fn.now(),
    })
}

// --- platform_admin_sessions -------------------------------------------------

export async function createSession(
  knex: Knex,
  session: { id: string; adminId: string; tokenHash: string; expiresAt: Date }
): Promise<void> {
  await knex("platform_admin_sessions").insert({
    id: session.id,
    admin_id: session.adminId,
    token_hash: session.tokenHash,
    expires_at: session.expiresAt,
  })
}

/** Returns the owning admin for a live (non-expired) session token hash. */
export async function findAdminBySessionToken(
  knex: Knex,
  tokenHash: string
): Promise<PlatformAdmin | undefined> {
  return knex<PlatformAdmin>("platform_admins as a")
    .join("platform_admin_sessions as s", "s.admin_id", "a.id")
    .where("s.token_hash", tokenHash)
    .andWhere("s.expires_at", ">", knex.fn.now())
    .whereNull("a.disabled_at")
    .first(
      "a.id",
      "a.email",
      "a.name",
      "a.password_hash",
      "a.role",
      "a.disabled_at"
    )
}

export async function deleteSession(knex: Knex, tokenHash: string): Promise<void> {
  await knex("platform_admin_sessions").where({ token_hash: tokenHash }).del()
}

export async function deleteExpiredSessions(knex: Knex): Promise<void> {
  await knex("platform_admin_sessions")
    .where("expires_at", "<=", knex.fn.now())
    .del()
}

// --- seller_applications -----------------------------------------------------

export async function insertApplication(
  knex: Knex,
  app: {
    id: string
    storeName: string
    ownerName: string
    ownerEmail: string
    desiredSubdomain: string
    country: string
    currency: string
    phone: string | null
    notes: string | null
  }
): Promise<void> {
  await knex("seller_applications").insert({
    id: app.id,
    store_name: app.storeName,
    owner_name: app.ownerName,
    owner_email: app.ownerEmail,
    desired_subdomain: app.desiredSubdomain,
    country: app.country,
    currency: app.currency,
    phone: app.phone,
    notes: app.notes,
    status: "pending",
    updated_at: knex.fn.now(),
  })
}

export async function listApplications(
  knex: Knex,
  filter: { status?: string } = {}
): Promise<SellerApplication[]> {
  const q = knex<SellerApplication>("seller_applications").orderBy("created_at", "desc")
  if (filter.status) {
    q.where({ status: filter.status })
  }
  return q
}

export async function findApplicationById(
  knex: Knex,
  id: string
): Promise<SellerApplication | undefined> {
  return knex<SellerApplication>("seller_applications").where({ id }).first()
}

export async function updateApplication(
  knex: Knex,
  id: string,
  fields: Partial<{
    status: SellerApplication["status"]
    tenant_id: string | null
    host: string | null
    provisioning_error: string | null
    reviewed_by: string | null
    reviewed_at: Date | null
  }>
): Promise<void> {
  await knex("seller_applications")
    .where({ id })
    .update({ ...fields, updated_at: knex.fn.now() })
}

// --- tenants (read for the console) ------------------------------------------

export type TenantRow = {
  id: string
  name: string
  slug: string
  status: string
  plan: string | null
  created_at: string
  host: string | null
}

export async function listTenants(knex: Knex): Promise<TenantRow[]> {
  return knex<TenantRow>("tenants as t")
    .leftJoin("tenant_domains as d", function join() {
      this.on("d.tenant_id", "t.id").andOn("d.is_primary", knex.raw("true"))
    })
    .orderBy("t.created_at", "desc")
    .select(
      "t.id",
      "t.name",
      "t.slug",
      "t.status",
      "t.plan",
      "t.created_at",
      "d.host"
    )
}

export async function findTenantById(
  knex: Knex,
  id: string
): Promise<TenantRow | undefined> {
  return knex<TenantRow>("tenants as t")
    .leftJoin("tenant_domains as d", function join() {
      this.on("d.tenant_id", "t.id").andOn("d.is_primary", knex.raw("true"))
    })
    .where("t.id", id)
    .first(
      "t.id",
      "t.name",
      "t.slug",
      "t.status",
      "t.plan",
      "t.created_at",
      "d.host"
    )
}

export type TenantDomainRow = {
  id: string
  host: string
  is_primary: boolean
  created_at: string
}

/** Every domain mapped to a tenant, primary first. */
export async function listTenantDomains(
  knex: Knex,
  tenantId: string
): Promise<TenantDomainRow[]> {
  return knex<TenantDomainRow>("tenant_domains")
    .where({ tenant_id: tenantId })
    .orderBy([
      { column: "is_primary", order: "desc" },
      { column: "created_at", order: "asc" },
    ])
    .select("id", "host", "is_primary", "created_at")
}

export type TenantStats = {
  products: number
  orders: number
  customers: number
}

export type TenantOperationalSummary = {
  stats: TenantStats
  adminEmail: string | null
}

export type PaymentProvider = "razorpay"
export type PaymentMode = "test" | "live"

export type TenantPaymentCredentialSummary = {
  provider: PaymentProvider
  mode: PaymentMode
  enabled: boolean
  key_id: string
  key_secret_hint: string
  webhook_secret_hint: string
  ready: boolean
  updated_at: string
}

type TenantPaymentCredentialRow = {
  tenant_id: string
  provider: PaymentProvider
  mode: PaymentMode
  enabled: boolean
  key_id: string
  key_secret_encrypted: string
  key_secret_hint: string
  webhook_secret_encrypted: string
  webhook_secret_hint: string
  updated_at: string
}

const DEV_CREDENTIAL_SECRET = "selfkart-dev-credential-secret-change-before-production"

function credentialsSecret(): string {
  const secret =
    process.env.SELFKART_CREDENTIALS_SECRET ||
    process.env.SELFKART_PLATFORM_SECRET ||
    process.env.JWT_SECRET ||
    process.env.COOKIE_SECRET ||
    DEV_CREDENTIAL_SECRET

  if (process.env.NODE_ENV === "production" && secret === DEV_CREDENTIAL_SECRET) {
    throw new Error("SELFKART_CREDENTIALS_SECRET must be set in production")
  }

  return secret
}

function credentialsKey(): Buffer {
  return createHash("sha256").update(credentialsSecret()).digest()
}

function encryptCredential(value: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", credentialsKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":")
}

function decryptCredential(value: string): string {
  const [version, iv, tag, encrypted] = value.split(":")
  if (version !== "v1" || !iv || !tag || !encrypted) {
    throw new Error("Unsupported encrypted credential format")
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    credentialsKey(),
    Buffer.from(iv, "base64url")
  )
  decipher.setAuthTag(Buffer.from(tag, "base64url"))

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

function secretHint(secret: string): string {
  return secret.slice(-4)
}

function toPaymentCredentialSummary(
  row: TenantPaymentCredentialRow
): TenantPaymentCredentialSummary {
  return {
    provider: row.provider,
    mode: row.mode,
    enabled: row.enabled,
    key_id: row.key_id,
    key_secret_hint: row.key_secret_hint,
    webhook_secret_hint: row.webhook_secret_hint,
    ready: Boolean(
      row.enabled &&
        row.key_id &&
        row.key_secret_encrypted &&
        row.webhook_secret_encrypted
    ),
    updated_at: row.updated_at,
  }
}

/**
 * Tenant-scoped operational data for the superadmin tenant detail page. Keep
 * these reads in one transaction and one SQL statement to avoid paying remote
 * Neon round trips for separate stats/admin-email reads.
 */
export async function getTenantOperationalSummary(
  knex: Knex,
  tenantId: string
): Promise<TenantOperationalSummary> {
  return knex.transaction(async (trx) => {
    await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])

    const result = await trx.raw<{
      rows: Array<{
        products: string | number
        orders: string | number
        customers: string | number
        admin_email: string | null
      }>
    }>(`
      select
        (select count(*)::int from "product" where "deleted_at" is null) as "products",
        (select count(*)::int from "order") as "orders",
        (select count(*)::int from "customer" where "deleted_at" is null) as "customers",
        (
          select "email"
          from "user"
          where "deleted_at" is null
          order by "created_at" asc
          limit 1
        ) as "admin_email"
    `)

    const row = result.rows[0]

    return {
      stats: {
        products: Number(row?.products ?? 0),
        orders: Number(row?.orders ?? 0),
        customers: Number(row?.customers ?? 0),
      },
      adminEmail: row?.admin_email ?? null,
    }
  })
}

/**
 * Counts a tenant's catalog/commerce rows. The product/order/customer tables are
 * RLS-scoped, so we open a transaction and set `app.current_tenant` (local to the
 * txn) before counting — exactly how the provisioning scripts read tenant data
 * from a platform (no-context) entry point.
 */
export async function getTenantStats(
  knex: Knex,
  tenantId: string
): Promise<TenantStats> {
  return knex.transaction(async (trx) => {
    await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])

    const [products] = await trx("product")
      .whereNull("deleted_at")
      .count<{ count: string }[]>("* as count")
    const [orders] = await trx("order").count<{ count: string }[]>("* as count")
    const [customers] = await trx("customer")
      .whereNull("deleted_at")
      .count<{ count: string }[]>("* as count")

    return {
      products: Number(products?.count ?? 0),
      orders: Number(orders?.count ?? 0),
      customers: Number(customers?.count ?? 0),
    }
  })
}

/**
 * The seller admin's login email for a tenant. Read from the RLS-scoped `user`
 * table under the tenant context (set on the txn), so it returns the actual
 * account email the seller signs in with — falling back to the application owner
 * email is left to the caller.
 */
export async function getTenantAdminEmail(
  knex: Knex,
  tenantId: string
): Promise<string | null> {
  return knex.transaction(async (trx) => {
    await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
    const row = await trx("user")
      .whereNull("deleted_at")
      .orderBy("created_at", "asc")
      .first("email")
    return (row?.email as string | undefined) ?? null
  })
}

export async function getTenantPaymentCredentialSummary(
  knex: Knex,
  tenantId: string,
  provider: PaymentProvider
): Promise<TenantPaymentCredentialSummary | null> {
  const row = await knex<TenantPaymentCredentialRow>("tenant_payment_credentials")
    .where({ tenant_id: tenantId, provider })
    .first()

  return row ? toPaymentCredentialSummary(row) : null
}

export async function getTenantPaymentCredentialSecret(
  knex: Knex,
  tenantId: string,
  provider: PaymentProvider,
  secret: "key_secret" | "webhook_secret"
): Promise<string | null> {
  const row = await knex<TenantPaymentCredentialRow>("tenant_payment_credentials")
    .where({ tenant_id: tenantId, provider })
    .first()

  if (!row) {
    return null
  }

  return decryptCredential(
    secret === "key_secret"
      ? row.key_secret_encrypted
      : row.webhook_secret_encrypted
  )
}

export async function upsertTenantPaymentCredentials(
  knex: Knex,
  tenantId: string,
  input: {
    provider: PaymentProvider
    mode: PaymentMode
    enabled: boolean
    keyId: string
    keySecret?: string
    webhookSecret?: string
  }
): Promise<TenantPaymentCredentialSummary> {
  const existing = await knex<TenantPaymentCredentialRow>("tenant_payment_credentials")
    .where({ tenant_id: tenantId, provider: input.provider })
    .first()

  const keySecret = input.keySecret?.trim()
  const webhookSecret = input.webhookSecret?.trim()

  if (!existing && !keySecret) {
    throw new Error("Razorpay key secret is required for first-time setup")
  }
  if (!existing && !webhookSecret) {
    throw new Error("Razorpay webhook secret is required for first-time setup")
  }

  const row = {
    tenant_id: tenantId,
    provider: input.provider,
    mode: input.mode,
    enabled: input.enabled,
    key_id: input.keyId.trim(),
    key_secret_encrypted: keySecret
      ? encryptCredential(keySecret)
      : existing!.key_secret_encrypted,
    key_secret_hint: keySecret ? secretHint(keySecret) : existing!.key_secret_hint,
    webhook_secret_encrypted: webhookSecret
      ? encryptCredential(webhookSecret)
      : existing!.webhook_secret_encrypted,
    webhook_secret_hint: webhookSecret
      ? secretHint(webhookSecret)
      : existing!.webhook_secret_hint,
    updated_at: knex.fn.now(),
  }

  await knex("tenant_payment_credentials")
    .insert(row)
    .onConflict(["tenant_id", "provider"])
    .merge({
      mode: row.mode,
      enabled: row.enabled,
      key_id: row.key_id,
      key_secret_encrypted: row.key_secret_encrypted,
      key_secret_hint: row.key_secret_hint,
      webhook_secret_encrypted: row.webhook_secret_encrypted,
      webhook_secret_hint: row.webhook_secret_hint,
      updated_at: knex.fn.now(),
    })

  const summary = await getTenantPaymentCredentialSummary(
    knex,
    tenantId,
    input.provider
  )
  if (!summary) {
    throw new Error("Could not read saved payment credentials")
  }

  return summary
}

export async function deleteTenantPaymentCredentials(
  knex: Knex,
  tenantId: string,
  provider: PaymentProvider
): Promise<void> {
  await knex("tenant_payment_credentials")
    .where({ tenant_id: tenantId, provider })
    .del()
}

/** The seller application a tenant was provisioned from (owner contact, etc.). */
export async function findApplicationByTenantId(
  knex: Knex,
  tenantId: string
): Promise<SellerApplication | undefined> {
  return knex<SellerApplication>("seller_applications")
    .where({ tenant_id: tenantId })
    .orderBy("created_at", "desc")
    .first()
}

/**
 * Sets a tenant's lifecycle status. 'suspended' takes the storefront offline
 * immediately (the domain resolver returns the status and the storefront refuses
 * to render anything but a "store unavailable" notice); 'active' restores it.
 */
export async function updateTenantStatus(
  knex: Knex,
  id: string,
  status: "active" | "suspended"
): Promise<void> {
  await knex("tenants")
    .where({ id })
    .update({ status, updated_at: knex.fn.now() })
}

export class HostInUseError extends Error {
  constructor(host: string) {
    super(`Host '${host}' is already mapped to another store`)
    this.name = "HostInUseError"
  }
}

/**
 * Repoints a tenant's PRIMARY storefront host. Updates the existing primary
 * tenant_domains row in place (preserving its publishable_key), or inserts a
 * primary row if the tenant somehow has none. Hosts are globally unique
 * (case-insensitive), so a collision with another store throws HostInUseError.
 */
export async function updateTenantPrimaryHost(
  knex: Knex,
  tenantId: string,
  host: string
): Promise<void> {
  const normalized = host.trim().toLowerCase()

  // Reject a host already claimed by a DIFFERENT tenant before we attempt the
  // write, so we can return a clean 409 instead of a raw unique-violation.
  const clash = await knex("tenant_domains")
    .whereRaw("lower(host) = ?", [normalized])
    .andWhereNot({ tenant_id: tenantId })
    .first("id")
  if (clash) {
    throw new HostInUseError(normalized)
  }

  const primary = await knex("tenant_domains")
    .where({ tenant_id: tenantId, is_primary: true })
    .first("id")

  if (primary) {
    await knex("tenant_domains")
      .where({ id: primary.id })
      .update({ host: normalized, updated_at: knex.fn.now() })
    return
  }

  await knex("tenant_domains").insert({
    id: `tdom_${normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`,
    tenant_id: tenantId,
    host: normalized,
    is_primary: true,
    updated_at: knex.fn.now(),
  })
}

/** Number of real orders a tenant has placed — the guard for hard deletion. */
export async function countTenantOrders(knex: Knex, tenantId: string): Promise<number> {
  return knex.transaction(async (trx) => {
    await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
    const [row] = await trx("order").count<{ count: string }[]>("* as count")
    return Number(row?.count ?? 0)
  })
}

export class TenantHasOrdersError extends Error {
  constructor(public readonly orders: number) {
    super(`Tenant has ${orders} order(s); refusing to delete without force`)
    this.name = "TenantHasOrdersError"
  }
}

export type TeardownResult = {
  tenantId: string
  ordersDeleted: number
  productsDeleted: number
}

/**
 * Hard-deletes a tenant and ALL of its data. Irreversible.
 *
 * Runs in one transaction with the tenant's RLS context set, so every
 * tenant-scoped delete is auto-filtered to this tenant (FORCE RLS) — it is
 * impossible to delete another tenant's rows. Link/auth/platform tables aren't
 * RLS'd, so those deletes are explicitly scoped by ids/emails gathered up front.
 *
 * Deletion leans on Postgres ON DELETE CASCADE (verified in schema): deleting a
 * `product` removes its variants/options/values/images/tag+category links;
 * `inventory_item` removes its levels; `price_set` removes prices+rules;
 * `fulfillment_set` removes service zones, geo zones, shipping options+rules;
 * `cart`/`customer`/`payment_collection`/`fulfillment` remove their children.
 * The remaining link tables (no cascade from the parent) are deleted first.
 *
 * Region/region_country are intentionally LEFT ALONE — they are platform-shared
 * across every tenant of that currency.
 *
 * @throws TenantHasOrdersError if the tenant has orders and `force` is false.
 */
export async function teardownTenant(
  knex: Knex,
  tenantId: string,
  opts: { force?: boolean } = {}
): Promise<TeardownResult> {
  const orders = await countTenantOrders(knex, tenantId)
  if (orders > 0 && !opts.force) {
    throw new TenantHasOrdersError(orders)
  }

  return knex.transaction(async (trx) => {
    await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])

    const ids = async (table: string, col = "id"): Promise<string[]> =>
      (await trx(table).where({ tenant_id: tenantId }).pluck(col)) as string[]

    // --- gather tenant-owned ids before deleting their parents ---
    const productIds = await ids("product")
    const variantIds = (await trx("product_variant")
      .where({ tenant_id: tenantId })
      .pluck("id")) as string[]
    const salesChannelIds = await ids("sales_channel")
    const stockLocationIds = await ids("stock_location")
    const apiKeyIds = await ids("api_key")
    const userEmails = (await trx("user")
      .where({ tenant_id: tenantId })
      .whereNotNull("email")
      .pluck("email")) as string[]

    const inSet = (col: string, values: string[]) => (qb: Knex.QueryBuilder) =>
      values.length ? qb.whereIn(col, values) : qb.whereRaw("false")

    // --- 1. link tables (no cascade from parent) ---
    if (variantIds.length) {
      await trx("product_variant_inventory_item").where(inSet("variant_id", variantIds)).del()
      await trx("product_variant_price_set").where(inSet("variant_id", variantIds)).del()
    }
    if (productIds.length) {
      await trx("product_sales_channel").where(inSet("product_id", productIds)).del()
      await trx("product_shipping_profile").where(inSet("product_id", productIds)).del()
    }
    if (salesChannelIds.length) {
      await trx("sales_channel_stock_location").where(inSet("sales_channel_id", salesChannelIds)).del()
      await trx("publishable_api_key_sales_channel").where(inSet("sales_channel_id", salesChannelIds)).del()
    }
    if (stockLocationIds.length) {
      await trx("location_fulfillment_set").where(inSet("stock_location_id", stockLocationIds)).del()
    }

    // --- 2. commerce (mostly empty for fresh sellers); child-first, rest cascades ---
    await trx("credit_line").where({ tenant_id: tenantId }).del()
    await trx("cart").where({ tenant_id: tenantId }).del() // cascades line items / shipping methods
    await trx("cart_address").where({ tenant_id: tenantId }).del()
    for (const t of [
      "order_line_item_adjustment", "order_line_item_tax_line", "order_line_item",
      "order_shipping_method_adjustment", "order_shipping_method_tax_line", "order_shipping_method",
      "order_shipping", "order_item", "order_transaction", "order_credit_line",
      "order_change_action", "order_change", "order_summary",
      "order_claim_item_image", "order_claim_item", "order_claim",
      "order_exchange_item", "order_exchange", "return_item", "return",
      "fulfillment", "fulfillment_address",
      "payment", "payment_session", "payment_collection",
      "order_address", "order",
    ]) {
      await trx(t).where({ tenant_id: tenantId }).del()
    }

    // --- 3. pricing / inventory (cascade to prices/rules and levels) ---
    await trx("price_set").where({ tenant_id: tenantId }).del()
    await trx("inventory_item").where({ tenant_id: tenantId }).del()

    // --- 4. catalog (product cascades variants/options/images/tag+cat links) ---
    await trx("product").where({ tenant_id: tenantId }).del()
    for (const t of ["product_category", "product_collection", "product_type", "product_tag"]) {
      await trx(t).where({ tenant_id: tenantId }).del()
    }

    // --- 5. fulfillment + locations (fulfillment_set cascades zones/options) ---
    await trx("fulfillment_set").where({ tenant_id: tenantId }).del()
    await trx("shipping_option").where({ tenant_id: tenantId }).del()
    await trx("stock_location").where({ tenant_id: tenantId }).del()
    await trx("stock_location_address").where({ tenant_id: tenantId }).del()

    // --- 6. channels + keys + customers + misc ---
    await trx("sales_channel").where({ tenant_id: tenantId }).del()
    if (apiKeyIds.length) {
      await trx("api_key").where({ tenant_id: tenantId }).del()
    }
    await trx("customer").where({ tenant_id: tenantId }).del() // cascades address / group links
    await trx("customer_group").where({ tenant_id: tenantId }).del()
    await trx("notification").where({ tenant_id: tenantId }).del()
    await trx("invite").where({ tenant_id: tenantId }).del()

    // --- 7. seller admin user + auth identity (frees the owner email) ---
    await trx("user").where({ tenant_id: tenantId }).del()
    if (userEmails.length) {
      const authIds = (await trx("provider_identity")
        .whereIn("entity_id", userEmails)
        .pluck("auth_identity_id")) as string[]
      // auth_identity cascades provider_identity; delete by gathered ids.
      if (authIds.length) {
        await trx("auth_identity").whereIn("id", authIds).del()
      }
      await trx("provider_identity").whereIn("entity_id", userEmails).del()
    }

    // --- 8. platform registry (host resolver + application + tenant row) ---
    await trx("tenant_domains").where({ tenant_id: tenantId }).del()
    await trx("seller_applications").where({ tenant_id: tenantId }).del()
    await trx("tenants").where({ id: tenantId }).del()

    return { tenantId, ordersDeleted: orders, productsDeleted: productIds.length }
  })
}

export async function dashboardCounts(knex: Knex): Promise<{
  pendingApplications: number
  activeTenants: number
  totalTenants: number
}> {
  const [pending] = await knex("seller_applications")
    .where({ status: "pending" })
    .count<{ count: string }[]>("* as count")
  const [active] = await knex("tenants")
    .where({ status: "active" })
    .count<{ count: string }[]>("* as count")
  const [total] = await knex("tenants").count<{ count: string }[]>("* as count")
  return {
    pendingApplications: Number(pending?.count ?? 0),
    activeTenants: Number(active?.count ?? 0),
    totalTenants: Number(total?.count ?? 0),
  }
}
