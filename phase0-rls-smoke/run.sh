#!/usr/bin/env bash
set -euo pipefail

SCHEMA_NAME="${SCHEMA_NAME:-phase0_rls_smoke}"
ITERATIONS="${ITERATIONS:-200}"
CONCURRENCY="${CONCURRENCY:-20}"
TENANT_A="${TENANT_A:-00000000-0000-0000-0000-00000000000a}"
TENANT_B="${TENANT_B:-00000000-0000-0000-0000-00000000000b}"

if [[ -z "${MIGRATOR_DATABASE_URL:-}" ]]; then
  echo "MIGRATOR_DATABASE_URL is required" >&2
  exit 2
fi

if [[ -z "${APP_DATABASE_URL:-}" ]]; then
  echo "APP_DATABASE_URL is required" >&2
  exit 2
fi

normalize_libpq_url() {
  local url="$1"
  url="${url//\?pgbouncer=true&/?}"
  url="${url//&pgbouncer=true/}"
  url="${url//\?pgbouncer=true/}"
  printf '%s' "$url"
}

MIGRATOR_PSQL_URL="$(normalize_libpq_url "$MIGRATOR_DATABASE_URL")"
APP_PSQL_URL="$(normalize_libpq_url "$APP_DATABASE_URL")"

command -v psql >/dev/null 2>&1 || {
  echo "psql is required" >&2
  exit 2
}

psql_migrator() {
  psql "$MIGRATOR_PSQL_URL" -v ON_ERROR_STOP=1 -X "$@"
}

psql_app() {
  psql "$APP_PSQL_URL" -v ON_ERROR_STOP=1 -X "$@"
}

quote_ident() {
  local raw="$1"
  printf '"%s"' "${raw//\"/\"\"}"
}

SCHEMA_IDENT="$(quote_ident "$SCHEMA_NAME")"

echo "Checking Postgres version..."
SERVER_VERSION_NUM="$(psql_migrator -Atqc "show server_version_num")"
if [[ "$SERVER_VERSION_NUM" != 17* ]]; then
  echo "Expected Postgres 17.x, got server_version_num=$SERVER_VERSION_NUM" >&2
  exit 1
fi

APP_USER="$(psql_app -Atqc "select current_user")"
if [[ -z "$APP_USER" ]]; then
  echo "Could not determine APP_DATABASE_URL current_user" >&2
  exit 1
fi

echo "Runtime role: $APP_USER"
ROLE_FLAGS="$(psql_migrator -v app_user="$APP_USER" -At <<'SQL'
select rolsuper::text || '|' || rolbypassrls::text
from pg_roles
where rolname = :'app_user';
SQL
)"
if [[ "$ROLE_FLAGS" != "false|false" ]]; then
  echo "Runtime role must be non-superuser and must not BYPASSRLS. Got: $ROLE_FLAGS" >&2
  exit 1
fi

echo "Creating isolated smoke schema..."
psql_migrator \
  -v schema_name="$SCHEMA_NAME" \
  -v app_user="$APP_USER" \
  -v tenant_a="$TENANT_A" \
  -v tenant_b="$TENANT_B" <<'SQL'
drop schema if exists :"schema_name" cascade;
create schema :"schema_name";

create table :"schema_name".products (
  id text primary key,
  tenant_id uuid not null,
  title text not null
);

alter table :"schema_name".products enable row level security;
alter table :"schema_name".products force row level security;

create policy products_tenant_isolation
on :"schema_name".products
for all
to public
using (
  tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
)
with check (
  tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
);

insert into :"schema_name".products (id, tenant_id, title) values
  ('a_1', :'tenant_a'::uuid, 'Tenant A Product 1'),
  ('a_2', :'tenant_a'::uuid, 'Tenant A Product 2'),
  ('b_1', :'tenant_b'::uuid, 'Tenant B Product 1'),
  ('b_2', :'tenant_b'::uuid, 'Tenant B Product 2');

grant usage on schema :"schema_name" to :"app_user";
grant select, insert, update, delete on :"schema_name".products to :"app_user";
SQL

TABLE_OWNER="$(psql_migrator -v schema_name="$SCHEMA_NAME" -At <<'SQL'
select tableowner
from pg_tables
where schemaname = :'schema_name'
  and tablename = 'products';
SQL
)"
if [[ "$TABLE_OWNER" == "$APP_USER" ]]; then
  echo "Runtime role owns products table; table owners can bypass RLS unless forced and should not be used as app role" >&2
  exit 1
fi

echo "Checking fail-closed behavior without tenant context..."
NO_CONTEXT_COUNT="$(psql_app -v schema_name="$SCHEMA_NAME" -At <<'SQL'
select count(*)
from :"schema_name".products;
SQL
)"
if [[ "$NO_CONTEXT_COUNT" != "0" ]]; then
  echo "Expected 0 rows without tenant context, got $NO_CONTEXT_COUNT" >&2
  exit 1
fi

check_one() {
  local tenant="$1"
  local schema_name="$2"
  local expected_rows="2"
  local expected_first="$tenant"
  local expected_after_commit="0"

  local output
  output="$(psql "$APP_PSQL_URL" -v ON_ERROR_STOP=1 -X -q -t -A \
    -v schema_name="$schema_name" \
    -v tenant="$tenant" <<'SQL'
begin;
set local app.current_tenant = :'tenant';
select count(*)::text || '|' || coalesce(min(tenant_id::text), 'none') || '|' || coalesce(max(tenant_id::text), 'none')
from :"schema_name".products;
commit;
select count(*)::text from :"schema_name".products;
SQL
)"

  local first_line
  local second_line
  first_line="$(printf '%s\n' "$output" | sed -n '1p')"
  second_line="$(printf '%s\n' "$output" | sed -n '2p')"

  if [[ "$first_line" != "$expected_rows|$expected_first|$expected_first" ]]; then
    echo "tenant=$tenant expected $expected_rows rows for only itself, got: $first_line" >&2
    return 1
  fi

  if [[ "$second_line" != "$expected_after_commit" ]]; then
    echo "tenant=$tenant expected tenant context to clear after commit, got rows: $second_line" >&2
    return 1
  fi
}

echo "Checking single-tenant transactions..."
check_one "$TENANT_A" "$SCHEMA_NAME"
check_one "$TENANT_B" "$SCHEMA_NAME"

echo "Running concurrent leak test: iterations=$ITERATIONS concurrency=$CONCURRENCY"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

failures=0
for i in $(seq 1 "$ITERATIONS"); do
  if (( i % 2 == 0 )); then
    tenant="$TENANT_A"
  else
    tenant="$TENANT_B"
  fi

  (
    check_one "$tenant" "$SCHEMA_NAME"
  ) >"$TMPDIR/$i.out" 2>"$TMPDIR/$i.err" || {
    cat "$TMPDIR/$i.err" >&2
    exit 1
  } &

  while (( "$(jobs -rp | wc -l | tr -d ' ')" >= CONCURRENCY )); do
    wait -n || failures=$((failures + 1))
  done
done

while (( "$(jobs -rp | wc -l | tr -d ' ')" > 0 )); do
  wait -n || failures=$((failures + 1))
done

if (( failures > 0 )); then
  echo "FAIL: $failures concurrent checks failed" >&2
  exit 1
fi

echo "Cleaning up smoke schema..."
psql_migrator -v schema_name="$SCHEMA_NAME" -qAt <<'SQL'
drop schema if exists :"schema_name" cascade;
SQL

echo "PASS: Postgres 17 RLS + SET LOCAL tenant isolation held under concurrent app connections"
