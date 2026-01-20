// server/trpc/routers/auth.ts (o similar)
import { publicProcedure, router } from "./trpc";

export const systemRouter = router({
  // Devuelve el usuario actual si existe, o `null` en peticiones anónimas.
  // El frontend ya gestiona la redirección al login cuando corresponde.
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),
});