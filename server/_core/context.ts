// server/_core/context.ts
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Ignoramos la base de datos y devolvemos siempre un usuario activo
  return {
    req,
    res,
    user: {
      id: "user-demo-123",
      name: "Smart User",
      email: "demo@smartmeal.app",
    },
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;