This `drizzle/` folder is retained for historical/migration artifacts only.

What remains here:

- `0000_reflective_deadpool.sql` — SQL schema snapshot used by `pnpm run db:import`.
- `schema.ts` — **runtime-free** TypeScript interfaces/types (kept so the codebase can
  continue to import database shapes without depending on Drizzle at runtime).

Why it's kept:

- The project intentionally removed Drizzle ORM/runtime to simplify local setups
  (the server now talks to MySQL via `mysql2/promise`).
- Migration SQL and type definitions are still useful for local DB imports and
  typing; keep them under `drizzle/` for clarity.

If you want to fully remove this folder:

1. Remove or migrate any code that imports `../drizzle/schema` (prefer `@shared` entrypoints).
2. Delete this directory and update `scripts/import-schema.ts` accordingly.

To restore Drizzle CLI functionality:

1. Re-install the Drizzle packages (e.g. `npm i -D drizzle-orm drizzle-kit`).
2. Recreate `drizzle.config.ts` (or restore from git history).

This folder is educational/reference-only — the app does NOT require Drizzle at runtime.
