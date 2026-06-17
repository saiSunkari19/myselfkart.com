export const CURRENT_TENANT_SQL =
  "nullif(current_setting('app.current_tenant', true), '')::uuid"

export function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

export function tenantColumnEqualsCurrentTenant(table: string): string {
  return `${quoteIdent(table)}."tenant_id" = ${CURRENT_TENANT_SQL}`
}

export function ownerTenantExists(
  ownerTable: string,
  currentTable: string,
  currentColumn: string
): string {
  return `exists (
    select 1
    from ${quoteIdent(ownerTable)} as owner_row
    where owner_row."id" = ${quoteIdent(currentTable)}.${quoteIdent(currentColumn)}
    and owner_row."tenant_id" = ${CURRENT_TENANT_SQL}
  )`
}

export function addDirectTenantResourceSql(table: string): string[] {
  const quotedTable = quoteIdent(table)
  const policyName = quoteIdent(`${table}_tenant_isolation`)
  const triggerName = quoteIdent(`trg_${table}_tenant_id`)
  const indexName = quoteIdent(`IDX_${table}_tenant_id`)

  return [
    `alter table if exists ${quotedTable} add column if not exists "tenant_id" uuid;`,
    `create index if not exists ${indexName} on ${quotedTable} ("tenant_id");`,
    `drop trigger if exists ${triggerName} on ${quotedTable};`,
    `
      create trigger ${triggerName}
      before insert or update of "tenant_id" on ${quotedTable}
      for each row
      execute function "selfkart_set_tenant_id"();
    `,
    `alter table if exists ${quotedTable} enable row level security;`,
    `alter table if exists ${quotedTable} force row level security;`,
    `drop policy if exists ${policyName} on ${quotedTable};`,
    `
      create policy ${policyName}
      on ${quotedTable}
      for all
      using (${tenantColumnEqualsCurrentTenant(table)})
      with check (${tenantColumnEqualsCurrentTenant(table)});
    `,
  ]
}

export function addNullableDirectTenantResourceSql(table: string): string[] {
  const quotedTable = quoteIdent(table)
  const policyPrefix = `${table}_tenant_isolation`
  const triggerName = quoteIdent(`trg_${table}_tenant_id`)
  const indexName = quoteIdent(`IDX_${table}_tenant_id`)
  const tenantPredicate = tenantColumnEqualsCurrentTenant(table)
  const platformPredicate = `${CURRENT_TENANT_SQL} is null and ${quoteIdent(table)}."tenant_id" is null`

  return [
    `
      create or replace function "selfkart_set_nullable_tenant_id"()
      returns trigger
      language plpgsql
      as $$
      declare
        current_tenant uuid;
      begin
        current_tenant := nullif(current_setting('app.current_tenant', true), '')::uuid;

        if current_tenant is null then
          if TG_OP = 'INSERT' and NEW.tenant_id is not null then
            raise exception 'tenant_id cannot be set without app.current_tenant for table %', TG_TABLE_NAME;
          end if;

          if TG_OP = 'UPDATE' and NEW.tenant_id is distinct from OLD.tenant_id then
            raise exception 'tenant_id cannot be changed for table %', TG_TABLE_NAME;
          end if;

          return NEW;
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
    `,
    `alter table if exists ${quotedTable} add column if not exists "tenant_id" uuid;`,
    `create index if not exists ${indexName} on ${quotedTable} ("tenant_id");`,
    `drop trigger if exists ${triggerName} on ${quotedTable};`,
    `
      create trigger ${triggerName}
      before insert or update of "tenant_id" on ${quotedTable}
      for each row
      execute function "selfkart_set_nullable_tenant_id"();
    `,
    `alter table if exists ${quotedTable} enable row level security;`,
    `alter table if exists ${quotedTable} force row level security;`,
    `drop policy if exists ${quoteIdent(`${policyPrefix}_select`)} on ${quotedTable};`,
    `drop policy if exists ${quoteIdent(`${policyPrefix}_insert`)} on ${quotedTable};`,
    `drop policy if exists ${quoteIdent(`${policyPrefix}_update`)} on ${quotedTable};`,
    `drop policy if exists ${quoteIdent(`${policyPrefix}_delete`)} on ${quotedTable};`,
    `drop policy if exists ${quoteIdent(policyPrefix)} on ${quotedTable};`,
    `
      create policy ${quoteIdent(`${policyPrefix}_select`)}
      on ${quotedTable}
      for select
      using (${tenantPredicate} or (${platformPredicate}));
    `,
    `
      create policy ${quoteIdent(`${policyPrefix}_insert`)}
      on ${quotedTable}
      for insert
      with check (${tenantPredicate} or (${platformPredicate}));
    `,
    `
      create policy ${quoteIdent(`${policyPrefix}_update`)}
      on ${quotedTable}
      for update
      using (${tenantPredicate})
      with check (${tenantPredicate});
    `,
    `
      create policy ${quoteIdent(`${policyPrefix}_delete`)}
      on ${quotedTable}
      for delete
      using (${tenantPredicate});
    `,
  ]
}

/**
 * Like {@link addNullableDirectTenantResourceSql}, but the SELECT (and write)
 * policies treat "no tenant context" as a PLATFORM/SYSTEM read that can see
 * EVERY row — not just tenant_id-null rows.
 *
 * This exists for `api_key` specifically. Medusa's framework registers
 * `ensurePublishableApiKeyMiddleware` directly on `/store*` (see
 * @medusajs/framework http/router.js → applyStorePublishableKeyMiddleware),
 * and it runs BEFORE any user-defined route middleware — i.e. before our
 * `domainTenantContextMiddleware` sets `app.current_tenant`. That framework
 * middleware looks the publishable key up by token (`query.graph` on api_key)
 * with NO tenant context. Under the stricter nullable policy a tenant-stamped
 * key is invisible without context, so the lookup returns 0 rows and the
 * request fails with "A valid publishable key is required to proceed with the
 * request". Allowing no-context reads to see all rows fixes the storefront
 * without leaking: that framework lookup always filters by the exact token, and
 * the admin "list keys" surface always runs WITH a tenant context (so a seller
 * still sees only their own keys). The insert trigger is unchanged, so a key
 * still cannot be stamped to a tenant without that tenant's context.
 */
export function addPlatformReadableDirectTenantResourceSql(table: string): string[] {
  const quotedTable = quoteIdent(table)
  const policyPrefix = `${table}_tenant_isolation`
  const triggerName = quoteIdent(`trg_${table}_tenant_id`)
  const indexName = quoteIdent(`IDX_${table}_tenant_id`)
  const tenantPredicate = tenantColumnEqualsCurrentTenant(table)
  const noContext = `${CURRENT_TENANT_SQL} is null`
  // Platform/system reads (no context) see everything; tenant context isolates.
  const readPredicate = `${tenantPredicate} or (${noContext})`
  // Insert stays strict: still cannot stamp a tenant_id without its context
  // (the nullable trigger also enforces this independently).
  const insertPredicate = `${tenantPredicate} or (${noContext} and ${quoteIdent(table)}."tenant_id" is null)`

  return [
    `alter table if exists ${quotedTable} add column if not exists "tenant_id" uuid;`,
    `create index if not exists ${indexName} on ${quotedTable} ("tenant_id");`,
    `drop trigger if exists ${triggerName} on ${quotedTable};`,
    `
      create trigger ${triggerName}
      before insert or update of "tenant_id" on ${quotedTable}
      for each row
      execute function "selfkart_set_nullable_tenant_id"();
    `,
    `alter table if exists ${quotedTable} enable row level security;`,
    `alter table if exists ${quotedTable} force row level security;`,
    `drop policy if exists ${quoteIdent(`${policyPrefix}_select`)} on ${quotedTable};`,
    `drop policy if exists ${quoteIdent(`${policyPrefix}_insert`)} on ${quotedTable};`,
    `drop policy if exists ${quoteIdent(`${policyPrefix}_update`)} on ${quotedTable};`,
    `drop policy if exists ${quoteIdent(`${policyPrefix}_delete`)} on ${quotedTable};`,
    `drop policy if exists ${quoteIdent(policyPrefix)} on ${quotedTable};`,
    `
      create policy ${quoteIdent(`${policyPrefix}_select`)}
      on ${quotedTable}
      for select
      using (${readPredicate});
    `,
    `
      create policy ${quoteIdent(`${policyPrefix}_insert`)}
      on ${quotedTable}
      for insert
      with check (${insertPredicate});
    `,
    `
      create policy ${quoteIdent(`${policyPrefix}_update`)}
      on ${quotedTable}
      for update
      using (${readPredicate})
      with check (${readPredicate});
    `,
    `
      create policy ${quoteIdent(`${policyPrefix}_delete`)}
      on ${quotedTable}
      for delete
      using (${readPredicate});
    `,
  ]
}

export function addDerivedTenantResourceSql(
  table: string,
  policyExpression: string
): string[] {
  const quotedTable = quoteIdent(table)
  const policyName = quoteIdent(`${table}_tenant_isolation`)

  return [
    `alter table if exists ${quotedTable} enable row level security;`,
    `alter table if exists ${quotedTable} force row level security;`,
    `drop policy if exists ${policyName} on ${quotedTable};`,
    `
      create policy ${policyName}
      on ${quotedTable}
      for all
      using (${policyExpression})
      with check (${policyExpression});
    `,
  ]
}
