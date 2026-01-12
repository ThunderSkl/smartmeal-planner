// server/trpc/routers/auth.ts (o similar)
import { publicProcedure, router } from "./trpc";

export const systemRouter = router({
  me: publicProcedure.query(() => {
    // Siempre devolvemos el usuario para que la web no redirija al login
    return {
      id: "user-demo-123",
      name: "Smart User",
      email: "demo@smartmeal.app",
      image: "https://ui-avatars.com/api/?name=Smart+User",
    };
  }),
});