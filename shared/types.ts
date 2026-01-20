/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

// `drizzle/schema.ts` contains runtime-free TypeScript types only (the project no longer
// depends on Drizzle at runtime). Re-export those types from a single entrypoint so other
// modules import from `@shared` instead of reaching into `drizzle/` directly.
export * from "../drizzle/schema";
export * from "./_core/errors";
