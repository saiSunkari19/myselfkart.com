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
