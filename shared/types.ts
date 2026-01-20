/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

// Centralized shared types (migrated from ORM-specific artifacts).
// Consumers should import types from `@shared` only — no runtime ORM dependency.
export * from "./schema";
export * from "./_core/errors";
