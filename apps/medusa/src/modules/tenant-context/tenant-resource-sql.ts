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
