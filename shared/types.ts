/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

// Centralized shared types (migrated from `drizzle/`).
// Consumers should import types from `@shared` only — no runtime Drizzle dependency.
export * from "./schema";
export * from "./_core/errors";
