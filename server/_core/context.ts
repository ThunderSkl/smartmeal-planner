// server/_core/context.ts
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { sdk } from "./sdk";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Intentamos autenticar mediante la cookie de sesión. Si falla, devolvemos `user: null`.
  try {
    const user = await sdk.authenticateRequest(req);
    return {
      req,
      res,
      user,
    } as const;
  } catch (err) {
    // No hacemos fallar la creación del contexto: las rutas públicas siguen funcionando.
    console.warn("[Context] unauthenticated request or auth error:", String(err));
    return {
      req,
      res,
      user: null,
    } as const;
  }
}

// Añadimos alias de tipo para compatibilidad y para que las importaciones existentes funcionen.
export type TrpcContext = inferAsyncReturnType<typeof createContext>;

export type Context = inferAsyncReturnType<typeof createContext>;