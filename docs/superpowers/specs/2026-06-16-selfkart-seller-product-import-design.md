# Selfkart Seller Product Import Wrapper Design

**Date:** 2026-06-16

## Goal

Allow each seller to upload the same seller-friendly product CSV without manually
pre-creating Medusa IDs for collections, categories, tags, types, sales channels,
stock locations, or inventory.

## Problem

Medusa's native product CSV import is ID-based. If a CSV contains
`Product Tag 1 = cloth-kids`, Medusa expects a row with
`product_tag.id = cloth-kids` to already exist. In Selfkart, table primary keys
are still global even though RLS filters rows by tenant, so the same raw taxonomy
ID cannot be safely reused by multiple sellers.

## Approach

Build a Selfkart wrapper around Medusa's native import flow.

The wrapper does not replace Medusa product creation. It normalizes seller CSV
data, creates tenant-scoped taxonomy/resources, strips raw global taxonomy IDs
from the Medusa upload CSV, and links products to tenant-scoped taxonomy after
Medusa creates the products.

## Architecture

- `selfkart-product-import` module helpers own CSV parsing, CSV rendering,
  deterministic tenant-scoped ID generation, taxonomy seed extraction, and
  product linking.
- Existing Medusa import remains the product/variant creation engine.
- The Medusa Admin route `/app/seller-import`, Admin API routes, and scripts call
  the same helper module so seller UI and pilot operations behave identically.
- All database writes run inside `runWithTenantContext` and set
  `app.current_tenant` in the transaction before touching RLS tables.

## Initial Scope

- Support the current Medusa template columns.
- Support the current association CSV columns generated for the clothing seller.
- Generate an import-safe Medusa CSV by blanking raw taxonomy/resource ID columns.
- Seed tenant-scoped product collections, types, tags, and categories.
- Link already-imported products to collections, types, tags, and categories by
  product handle.
- Keep stock location, sales channel, and inventory quantities in the existing
  `seed-tenant-inventory-resources.ts` flow for now.

## Out of Scope

- Replacing Medusa's product import workflow.
- Creating region/shipping/payment configuration.
- Supporting arbitrary spreadsheet formats beyond CSV.

## Error Handling

- Missing required headers fail with a clear error listing missing columns.
- Empty files fail before database writes.
- Rows without product handles are ignored for linking and counted as skipped.
- Re-running the same import prep/linking is idempotent.

## Testing

- Unit-level script asserts CSV transform and tenant-scoped IDs.
- Integration script asserts two tenants can seed/link from the same association
  CSV without sharing taxonomy IDs.
- TypeScript and whitespace checks remain required before handoff.
