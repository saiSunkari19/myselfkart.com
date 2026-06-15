# Phase 0 RLS Smoke Test

This is the minimum database gate for the Medusa + Neon shared-RLS plan.

It does not replace the full Medusa Phase 0 spike. It proves the database
requirements that the Medusa patch must rely on:

- target database is Postgres 17
- runtime connection uses a non-superuser role
- runtime role does not own tenant-scoped tables
- RLS fails closed with no tenant context
- `SET LOCAL app.current_tenant` works inside transactions
- concurrent requests through the app connection never see another tenant
- tenant context is gone after commit

## Required URLs

Use a throwaway Neon branch/database.

```sh
export MIGRATOR_DATABASE_URL='postgres://...direct-neon-url...'
export APP_DATABASE_URL='postgres://...pooled-neon-url...'
```

`MIGRATOR_DATABASE_URL` should be the direct owner/migration connection.
`APP_DATABASE_URL` should be the runtime app role connection. For the real gate,
use Neon's pooled URL for `APP_DATABASE_URL`.

## Run

```sh
bash phase0-rls-smoke/run.sh
```

Optional knobs:

```sh
ITERATIONS=500 CONCURRENCY=50 bash phase0-rls-smoke/run.sh
```

Pass criteria: the script exits `0` and prints `PASS`.

Fail criteria: any non-zero exit means do not freeze the architecture yet.
Fix the role/RLS/pooler issue first, or pivot to the dedicated-instance fallback.
