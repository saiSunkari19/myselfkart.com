# Tenant Resource Isolation Design

**Date:** 2026-06-15  
**Project:** Selfkart Medusa multi-tenant backend  
**Status:** Approved design, pending implementation plan  
**Primary goal:** Stop accidental shared Medusa module data by introducing a reusable tenant-resource isolation boundary, then prove it with Inventory, Stock Location, and Sales Channel isolation.

## Problem

The current tenant isolation work proves product, cart, customer, order, admin user, and invite isolation. Live Neon inspection showed the next leak:

```txt
inventory_item          RLS disabled, no tenant_id
inventory_level         RLS disabled, no tenant_id
reservation_item        RLS disabled, no tenant_id
stock_location          RLS disabled, no tenant_id
stock_location_address  RLS disabled, no tenant_id
sales_channel           RLS disabled, no tenant_id
api_key                 RLS disabled, no tenant_id
```

This causes seller admin Inventory to show inventory from both the clothing seller and the ticket seller. It also shows zero stock because imported products created inventory items but no stock locations or inventory levels.

The underlying issue is architectural: Medusa modules can expose their own Admin endpoints and tables. A TypeScript-only wrapper around custom code is not enough. The isolation boundary must also own database RLS, backfills, link-derived ownership, and regression tests.

## Scope

This first implementation must cover:

- A reusable tenant-resource registry/pattern under the existing tenant-context module.
- Inventory isolation for:
  - `inventory_item`
  - `inventory_level`
  - `reservation_item`
- Stock/sales isolation for:
  - `stock_location`
  - `stock_location_address`
  - `sales_channel`
- Seller seed/onboarding support for one stock location and one sales channel per tenant.
- Tests proving seller A and seller B inventory, locations, and sales channels are isolated.

This first implementation must not fully implement Shiprocket or Razorpay providers. It should design them as next plug-ins that use the same tenant-resource pattern.

## Tenant Resource Model

Every table touched by a Medusa module must be classified as one of three ownership types:

### Direct Tenant-Owned

The table has a `tenant_id uuid` column, a tenant-stamping trigger, tenant-aware indexes where needed, and forced RLS based on `app.current_tenant`.

Use this for rows that naturally belong to one seller:

- `stock_location`
- `stock_location_address`
- `sales_channel`
- future `tenant_shiprocket_config`
- future `tenant_razorpay_config`

### Derived Tenant-Owned

The table does not need its own `tenant_id` if ownership can be safely proven through a tenant-owned parent or link table.

Use this when the row belongs to a tenant through a Medusa module relationship:

- `inventory_item` derives from `product_variant_inventory_item -> product_variant.tenant_id`.
- `inventory_level` derives from `inventory_item`.
- `reservation_item` derives from `inventory_item`.

If a derived policy becomes too complex or blocks normal Medusa writes, the implementation may switch that table to direct tenant ownership, but the spec and tests must make the choice explicit.

### Platform-Shared

The table is intentionally shared across tenants. Shared rows must be documented and guarded; no table should remain global by accident.

Known candidate:

- Medusa's platform default `api_key`.

Seller-created API keys still need a follow-up tenant-nullable model and must remain a tracked security item if not fixed in this implementation.

## Inventory Design

Medusa creates `inventory_item` rows when product variants have `manage_inventory=true`. Those items are linked to product variants through `product_variant_inventory_item`, which is already RLS-protected by ownership from `product_variant`.

The Inventory Admin page queries `inventory_items` directly. Therefore `inventory_item` must be protected directly or with an RLS policy that checks whether the inventory item has a visible product-variant link for the current tenant.

Expected behavior:

- Tenant A sees only clothing inventory items.
- Tenant B sees only ticket inventory items.
- No tenant context sees zero inventory items.
- Cross-tenant inventory-item lookup returns zero rows.
- Inventory levels and reservations follow the same tenant boundary.

## Stock Location and Sales Channel Design

Each seller needs its own stock location and sales channel.

The seller stock location and sales channel are direct tenant-owned resources. Onboarding/seed scripts should create or reuse them under tenant context.

Expected behavior:

- Tenant A sees only Tenant A stock locations and sales channels.
- Tenant B sees only Tenant B stock locations and sales channels.
- No tenant context sees zero stock locations and zero sales channels.
- Products imported by a seller can be linked to that seller's sales channel.
- Inventory levels can be created at that seller's stock location with non-zero quantities.

## Razorpay and Shiprocket Follow-On Design

Razorpay and Shiprocket should use tenant-scoped configuration tables, not global environment variables per seller.

Future tables:

```txt
tenant_razorpay_config
tenant_shiprocket_config
```

Both are direct tenant-owned. Credentials must be encrypted or stored through an approved secret mechanism before production use. Provider code should resolve credentials at runtime from `requireTenantContext()`, so one Medusa provider implementation can serve all sellers without sharing credentials.

## Error Handling

- Missing tenant context must fail closed.
- Wrong-tenant lookups must return zero rows, not fallback to global rows.
- Platform-level rows must be explicitly marked and tested.
- Seed scripts must be idempotent per tenant.
- Backfills must be deterministic and reject ambiguous ownership instead of guessing.

## Tests

Add a focused RLS test suite for module isolation:

- `inventory-module-isolation.test.js`
- `sales-channel-stock-location-isolation.test.js`

Required assertions:

- Tenant A inventory contains only clothing-linked inventory items.
- Tenant B inventory contains only ticket-linked inventory items.
- No tenant context sees zero inventory items.
- Tenant A cannot see Tenant B stock locations or sales channels.
- Tenant B cannot see Tenant A stock locations or sales channels.
- Inventory levels are non-zero after the seed/onboarding script runs.
- Existing RLS suite still passes.

## Verification

Use Neon disposable branches for migration verification:

1. Create a temporary Neon branch.
2. Run migrations as `neondb_owner` using the direct URL.
3. Run app/tests as `medusa_app` using the pooled URL.
4. Verify runtime role is not superuser and does not have `BYPASSRLS`.
5. Delete the temporary branch after verification.

Use Context7 before changing Medusa module/provider code. Use Neon MCP for schema inspection and migration validation where possible.

## Acceptance Criteria

- Inventory page no longer shows both sellers' inventory under each seller login.
- Inventory item, inventory level, stock location, and sales channel isolation is proven by automated tests.
- Stock no longer displays as zero solely because no seller stock location/inventory level exists.
- The tenant-resource model is documented well enough for Shiprocket and Razorpay to plug in next.
- The implementation plan explicitly tracks unresolved `api_key` tenant scoping if not fixed in this pass.
