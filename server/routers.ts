import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { menuRouter } from "./menuRouter";
import { z } from "zod";
import { 
  getUserPreferences, 
  upsertUserPreferences,
  createWeeklyMenu,
  getWeeklyMenu,
  getUserWeeklyMenus,
  getActiveWeeklyMenu,
  updateWeeklyMenu,
  setActiveWeeklyMenu,
  createShoppingList,
  getShoppingListByMenuId,
  updateShoppingList,
} from "./db";
import type { DayMenu, NutritionSummary, ShoppingItem } from "@shared";

export const appRouter = router({
  system: systemRouter,
  menu: menuRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    register: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ ctx, input }) => {
        const openId = `email:${input.email.toLowerCase()}`;
        const crypto = await import('crypto');
        const salt = crypto.randomBytes(8).toString('hex');
        const hash = crypto.scryptSync(input.password, salt, 64).toString('hex');
        const stored = `scrypt$${salt}$${hash}`;

        await (await import('./db')).upsertUser({
          openId,
          name: input.name,
          email: input.email.toLowerCase(),
          loginMethod: 'email',
          password: stored,
        });

        const sessionToken = await (await import('./_core/sdk')).sdk.createSessionToken(openId, { name: input.name, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true } as const;
      }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const openId = `email:${input.email.toLowerCase()}`;
        const db = await import('./db');
        const user = await db.getUserByOpenId(openId);
        if (!user) throw new Error('Invalid credentials');

        const stored = (user as any).password;
        if (!stored) throw new Error('Invalid credentials');

        const crypto = await import('crypto');
        const parts = (stored as string).split('$');
        if (parts.length !== 3 || parts[0] !== 'scrypt') throw new Error('Invalid credentials');
        const salt = parts[1];
        const expected = parts[2];
        const derived = crypto.scryptSync(input.password, salt, 64).toString('hex');
        const ok = crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(expected, 'hex'));
        if (!ok) throw new Error('Invalid credentials');

        // Ensure the session payload contains a non-empty `name` (some older users may have null).
        const safeName = user.name ?? user.email?.split('@')[0] ?? user.openId;
        const sessionToken = await (await import('./_core/sdk')).sdk.createSessionToken(openId, { name: safeName, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        // Return the user (omit password) so the client can update `auth.me` immediately
        return {
          success: true,
          user: {
            id: user.id,
            openId: user.openId,
            name: user.name ?? user.email?.split('@')[0] ?? null,
            email: user.email ?? null,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastSignedIn: user.lastSignedIn,
          },
        } as const;
      }),
  }),

  // ==================== USER PREFERENCES ====================
  preferences: router({
    get: protectedProcedure
      .query(async ({ ctx }) => {
        const prefs = await getUserPreferences(ctx.user.id);
        return prefs || null;
      }),

    update: protectedProcedure
      .input(z.object({
        allergies: z.array(z.string()).optional(),
        dietaryRestrictions: z.array(z.string()).optional(),
        nutritionalGoals: z.array(z.string()).optional(),
        preferredCuisines: z.array(z.string()).optional(),
        dislikedIngredients: z.array(z.string()).optional(),
        targetCalories: z.number().int().positive().optional(),
        targetProtein: z.number().int().positive().optional(),
        targetCarbs: z.number().int().positive().optional(),
        targetFat: z.number().int().positive().optional(),
        mealsPerDay: z.number().int().min(1).max(6).optional(),
        includeSnacks: z.number().int().min(0).max(1).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get current preferences to merge with updates
        const current = await getUserPreferences(ctx.user.id);
        
        const updates = {
          allergies: input.allergies ?? current?.allergies ?? [],
          dietaryRestrictions: input.dietaryRestrictions ?? current?.dietaryRestrictions ?? [],
          nutritionalGoals: input.nutritionalGoals ?? current?.nutritionalGoals ?? [],
          preferredCuisines: input.preferredCuisines ?? current?.preferredCuisines ?? [],
          dislikedIngredients: input.dislikedIngredients ?? current?.dislikedIngredients ?? [],
          targetCalories: input.targetCalories ?? current?.targetCalories ?? 2000,
          targetProtein: input.targetProtein ?? current?.targetProtein ?? 50,
          targetCarbs: input.targetCarbs ?? current?.targetCarbs ?? 250,
          targetFat: input.targetFat ?? current?.targetFat ?? 65,
          mealsPerDay: input.mealsPerDay ?? current?.mealsPerDay ?? 3,
          includeSnacks: input.includeSnacks ?? current?.includeSnacks ?? 1,
        };

        await upsertUserPreferences(ctx.user.id, updates);
        return updates;
      }),
  }),

  // ==================== WEEKLY MENUS ====================
  menus: router({
    create: protectedProcedure
      .input(z.object({
        menuData: z.record(z.string(), z.any()),
        nutritionSummary: z.any(),
        startDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createWeeklyMenu({
          userId: ctx.user.id,
          menuData: input.menuData as Record<string, DayMenu>,
          nutritionSummary: input.nutritionSummary as NutritionSummary,
          startDate: input.startDate,
          isActive: 0,
          notes: input.notes,
        });
        return result;
      }),

    get: protectedProcedure
      .input(z.object({ menuId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const menu = await getWeeklyMenu(input.menuId);
        if (!menu || menu.userId !== ctx.user.id) {
          return null;
        }
        return menu;
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().int().default(10) }))
      .query(async ({ ctx, input }) => {
        return await getUserWeeklyMenus(ctx.user.id, input.limit);
      }),

    getActive: protectedProcedure
      .query(async ({ ctx }) => {
        return await getActiveWeeklyMenu(ctx.user.id);
      }),

    setActive: protectedProcedure
      .input(z.object({ menuId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const menu = await getWeeklyMenu(input.menuId);
        if (!menu || menu.userId !== ctx.user.id) {
          throw new Error("Menu not found or unauthorized");
        }
        await setActiveWeeklyMenu(ctx.user.id, input.menuId);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        menuId: z.number().int(),
        menuData: z.record(z.string(), z.any()).optional(),
        nutritionSummary: z.any().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const menu = await getWeeklyMenu(input.menuId);
        if (!menu || menu.userId !== ctx.user.id) {
          throw new Error("Menu not found or unauthorized");
        }

        const updates: any = {};
        if (input.menuData) updates.menuData = input.menuData;
        if (input.nutritionSummary) updates.nutritionSummary = input.nutritionSummary;
        if (input.notes !== undefined) updates.notes = input.notes;

        await updateWeeklyMenu(input.menuId, updates);
        return { success: true };
      }),
  }),

  // ==================== SHOPPING LISTS ====================
  shoppingLists: router({
    create: protectedProcedure
      .input(z.object({
        weeklyMenuId: z.number().int(),
        items: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unit: z.string(),
          category: z.string(),
          checked: z.boolean().default(false),
          estimatedCost: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the menu belongs to the user
        const menu = await getWeeklyMenu(input.weeklyMenuId);
        if (!menu || menu.userId !== ctx.user.id) {
          throw new Error("Menu not found or unauthorized");
        }

        const result = await createShoppingList({
          weeklyMenuId: input.weeklyMenuId,
          userId: ctx.user.id,
          items: input.items as ShoppingItem[],
          isCompleted: 0,
        });
        return result;
      }),

    getByMenuId: protectedProcedure
      .input(z.object({ weeklyMenuId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const list = await getShoppingListByMenuId(input.weeklyMenuId);
        if (!list || list.userId !== ctx.user.id) {
          return null;
        }
        return list;
      }),

    update: protectedProcedure
      .input(z.object({
        listId: z.number().int(),
        items: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unit: z.string(),
          category: z.string(),
          checked: z.boolean(),
          estimatedCost: z.number().optional(),
        })).optional(),
        isCompleted: z.number().int().min(0).max(1).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Add authorization check for shopping list
        const updates: any = {};
        if (input.items) updates.items = input.items;
        if (input.isCompleted !== undefined) updates.isCompleted = input.isCompleted;

        await updateShoppingList(input.listId, updates);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
