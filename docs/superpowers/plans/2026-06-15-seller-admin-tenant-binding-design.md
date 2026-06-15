# Seller Admin ↔ Tenant Binding — Design

> **Status:** Design only (2026-06-15). No code written yet. Prerequisite for a
> per-seller Medusa Admin dashboard. Builds on the passed Phase 0B RLS gate.

## Problem

Medusa ships a complete admin dashboard (a React SPA the backend serves at
`/app`). A seller would use it to manage products, catalogue, orders, payments,
and customers — all built-in pages, nothing to design.

Two things block a real per-seller login today:

1. **Tenant resolution is a spike.** `tenantContextMiddleware` matches `/admin*`
   and returns 403 unless the request carries the test header
   `x-selfkart-test-tenant-id`. A browser session never sends it, so the
   dashboard breaks right after login.
2. **Admin identity tables are not tenant-scoped.** Phase 0B RLS covers commerce
   tables only. Admin users are global — nothing says "this login is Seller A".

## Two separate concerns (do not conflate)

### Concern 1 — Tenant resolution for admin sessions (MUST-HAVE, functional)

Make every `/admin*` request run under the logged-in user's tenant, so the
existing dashboard shows only that seller's data. This is what makes the
dashboard "per-seller". **It does not require RLS on the `user` table** — it
requires a reliable `user_id → tenant_id` lookup that works during auth.

### Concern 2 — Isolating the admin identity tables (DEFENSE-IN-DEPTH, secondary)

So Seller A cannot enumerate Seller B's admin users / invites / API keys via the
Users and Settings pages. This needs RLS or scoping on `user`, `invite`,
`api_key`. Trickier because of auth bootstrapping (see open question).

Ship Concern 1 first; it unblocks the dashboard. Concern 2 hardens it.

## Relevant Medusa 2.15.5 schemas (verified from installed package migrations)

```txt
user              id, first_name, last_name, email, avatar_url, metadata, *_at
                  IDX_user_email on (email) WHERE deleted_at IS NULL  -- NON-unique
invite            id, email, accepted, token, expires_at, metadata, *_at
                  IDX_invite_email UNIQUE (email) WHERE deleted_at IS NULL  -- global unique
auth_identity     id, entity_id, provider, user_metadata, app_metadata, provider_metadata
                  UNIQUE (provider, entity_id)  -- global unique
provider_identity id, entity_id, provider, auth_identity_id, *_metadata, *_at
                  (emailpass password hash lives in provider_metadata)
api_key           id, token, salt, redacted, title, type, last_used_at, created_by, ...
```

**Admin login flow:** `POST /auth/user/emailpass` validates against
`provider_identity` (entity_id = email), returns a JWT. `auth_identity.app_metadata`
holds `{ user_id }` linking the credential to the actor. `/admin/*` is
auto-protected by Medusa; the `authenticate("user")` step populates
`req.auth_context.actor_id` (= the `user.id`).

## Design

### Where tenant_id lives

**Decision: add `tenant_id uuid` to the `user` table** (same pattern as the
Phase 0B commerce migration) AND stamp `tenant_id` into
`auth_identity.app_metadata` at creation time.

- The `user.tenant_id` column is the source of truth and enables RLS for the
  Users page (Concern 2).
- The `app_metadata.tenant_id` copy is what the **resolution middleware reads**,
  so it never has to read a possibly-RLS-hidden `user` row to learn the tenant
  (avoids the bootstrap chicken-and-egg — see open question).
- Platform/super-admins (Phase 10) get `tenant_id IS NULL` and are only visible
  under a platform context.

### Concern 1 — resolution middleware (replaces the test-header spike)

Replace `tenantContextMiddleware` on `/admin*` with one that runs **after**
Medusa's built-in `authenticate("user")` and:

```txt
1. Read tenant_id from req.auth_context (app_metadata.tenant_id).
   - If the platform exposes it on auth_context, no DB read is needed.
   - Fallback: one indexed lookup against a NON-RLS user→tenant source.
2. If no tenant_id and the user is not a platform admin -> 403.
3. runWithTenantContext({ tenantId, source: "session" }, next)
   -> the existing db-context hook sets app.current_tenant for the txn.
```

Keep the test-header path available ONLY under an explicit test env flag, never
in production, so the Phase 0B RLS tests keep working.

### Concern 1 — creating a seller admin (binding)

A workflow / script `create-seller-admin` that, for a given `tenant_id`:

```txt
1. Create the user row with tenant_id set (under that tenant's context).
2. Register emailpass credential (auth_identity + provider_identity).
3. Stamp auth_identity.app_metadata = { user_id, tenant_id }.
```

Reuse Medusa's user-creation path (the `medusa user` CLI / createUserAccount
workflow + setAuthAppMetadataStep) and wrap it to inject tenant_id. One seller
admin per tenant to start; multi-user-per-seller + roles is Phase 5 (RBAC).

### Concern 2 — RLS / scoping on identity tables

| Table | Plan | Notes |
|---|---|---|
| `user` | add `tenant_id`, enable+force RLS, tenant policy; allow `tenant_id IS NULL` only under platform context | Resolution reads `app_metadata`, NOT this table, so login still works. The Users page is then scoped. |
| `invite` | add `tenant_id`, replace global `UNIQUE(email)` with tenant-aware unique index, RLS | Invites are created inside an authenticated session (tenant known) → RLS clean. |
| `api_key` | add `tenant_id`, RLS; publishable keys scoped to the seller's sales channel | Storefront key per tenant; ties into Phase 1 storefront. |
| `auth_identity` / `provider_identity` | **leave un-RLS'd** | Login looks these up by (provider, email) BEFORE any tenant is known. Forcing RLS here would break auth. Tenant lives in `app_metadata` instead. |

**Known limitation for the pilot:** `auth_identity` has a global
`UNIQUE(provider, entity_id)`. For emailpass, `entity_id` = email, so **two
sellers cannot both have an admin with the same email address**. Acceptable for a
2–3 seller pilot. Long-term options: per-tenant email namespacing, or a single
platform identity carrying tenant in `app_metadata`. Document and revisit in
Phase 5/10.

## Open question requiring a spike (before implementing Concern 2)

**Does Medusa's `authenticate("user")` read the `user` table during auth, or only
`auth_identity`?** If it reads `user`, forcing RLS on `user` could hide the actor
during login (no tenant context set yet) and break the dashboard.

Spike on a disposable Neon branch (Phase 0B methodology):
1. Add `tenant_id` to `user`, enable+force RLS with a tenant policy.
2. Create a seller admin bound to Tenant A.
3. Attempt login via `/auth/user/emailpass` + `GET /admin/users/me`.
4. Confirm login succeeds and `/admin/users/me` returns only the Tenant A user.
5. If login breaks, fall back to a permissive `user` read policy (resolve via
   `app_metadata` only) and scope the Users *list* a different way, or defer
   Concern 2.

## Validation plan (mirrors Phase 0B)

On a disposable migrated Neon branch, through the pooled `medusa_app` role:

- Create two seller admins in Tenant A and Tenant B.
- Log in as each; assert each sees only its own products/orders/customers.
- Assert Seller A's Users / Invites / API-keys pages never show Seller B rows.
- Assert a session with no/forbidden tenant fails closed (403 / zero rows).
- Add integration tests under `apps/medusa/tests/integration/rls/` for the
  identity tables, matching the existing pattern.

## Validation results (2026-06-15) — Concern 1 implemented, read-path gap found

Implemented and validated on disposable Neon branch `phase1-seller-admin-verify`
(migrated with owner, exercised through the pooled `medusa_app` role, deleted
after the run):

**Spike answered (from Medusa 2.15.5 source, confirmed via Context7):**
- `authenticate("user")` builds `req.auth_context` purely from the JWT/session;
  it never reads the `user` table. `generateJwtTokenForAuthIdentity` spreads the
  whole `auth_identity.app_metadata` into the signed JWT.
- The framework registers the `/admin` `authenticate` middleware BEFORE custom
  `defineMiddlewares` middlewares, so `req.auth_context` is populated when our
  middleware runs. → Forcing RLS on `user` later (Concern 2) is safe for auth.

**Concern 1 works (proven):**
- `create-seller-admin` produced two admins; each `user.tenant_id` equals its
  `auth_identity.app_metadata.tenant_id`, linked to distinct tenants.
- Logging in over HTTP as seller A returned a JWT whose `app_metadata.tenant_id`
  is tenant A. Unauthenticated `/admin/products` → 401. So tenant resolution is
  correct end to end: login → JWT carries tenant → middleware reads it.
- `medusa_app` already holds full DML on `user`/`auth_identity`/`provider_identity`/
  `invite`/`api_key` (project-level grant), so the dashboard can run as the
  runtime role.

**BLOCKER discovered — RLS does not apply on Medusa's read path:**

```txt
Under tenant-A context, against the pooled medusa_app connection:
  plain knex read (no transaction)      -> 0 rows   (RLS fail-closed)
  knex.transaction(...) read (hook)     -> 2 rows   (correct)
  query.graph (the /admin/products path)-> 0 rows   (RLS fail-closed)
Result: a logged-in seller sees ZERO products (and zero of everything).
```

Root cause: the Phase 0B patch sets `app.current_tenant` only inside
`pgConnection.transaction(...)`. Medusa's read/query layer (`query.graph`,
MikroORM `@InjectManager` finds) runs reads WITHOUT a transaction, so the hook
never fires and RLS hides every row. This is safe (fail-closed) but makes the
app unusable — and it was not exercised by the Phase 0B gate, which tested RLS at
the SQL level only, never through Medusa's read path.

### Options for the read-path fix (decision needed before the app is usable)

1. **Per-request transaction for tenant-scoped routes** — wrap each `/admin*`
   (and later `/store*`) request's DB work in one transaction so the existing
   hook applies `set_config`. Cleanest conceptually; needs a mechanism to make
   Medusa's read path transactional (not default behaviour).
2. **Patch the read/manager path** — extend the `@medusajs/utils` patch so a
   tenant-scoped read opens a short transaction (or applies `set_config`) when
   ALS context is present. Most "make RLS just work", deepest patch.
3. **Session-pinned connection** — connect the app via Neon's direct
   (session-mode) endpoint and `SET app.current_tenant` per checked-out
   connection. Avoids the transaction requirement but drops transaction-pooling
   and changes the connection model (Neon direct-connection limits apply).

This reopens part of the Phase 0B conclusion: the DB-level gate still holds, but
"Medusa preserves tenant context through its APIs" is NOT yet true for reads.

## Suggested implementation order

1. Spike the open question (above). Decide the `user` RLS approach.
2. Migration: `user.tenant_id` (+ RLS per spike outcome), `invite` tenant-aware,
   `api_key` tenant-aware.
3. `create-seller-admin` workflow/script + app_metadata stamping.
4. Resolution middleware (post-auth) replacing the test-header spike.
5. Integration tests + disposable-branch validation.
6. Then proceed to / resume the storefront (Phase 1), which reuses the same
   tenant-from-domain resolution on `/store*`.
```

