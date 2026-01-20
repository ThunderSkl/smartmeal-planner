import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateWeeklyMenu, generateShoppingList } from "./menuGenerator";
import { getUserPreferences, createWeeklyMenu, createShoppingList } from "./db";
import type { DayMenu, NutritionSummary, ShoppingItem } from "@shared";

export const menuRouter = router({
  generate: protectedProcedure
    .input(z.object({
      numberOfDays: z.number().int().min(1).max(30).default(7),
      startDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user preferences
      const preferences = await getUserPreferences(ctx.user.id);
      
      if (!preferences) {
        throw new Error("User preferences not found. Please set up your dietary preferences first.");
      }

      // Generate menu using AI
      const { menuData, nutritionSummary } = await generateWeeklyMenu({
        preferences,
        numberOfDays: input.numberOfDays,
        startDate: input.startDate,
      });

      // Save menu to database
      const startDate = input.startDate || new Date();
      const menuResult = await createWeeklyMenu({
        userId: ctx.user.id,
        menuData: menuData as Record<string, DayMenu>,
        nutritionSummary: nutritionSummary as NutritionSummary,
        startDate,
        isActive: 1, // Set as active by default
      });

      // Generate and save shopping list
      const shoppingItems = generateShoppingList(menuData);
      const listResult = await createShoppingList({
        weeklyMenuId: (menuResult as any).insertId || 0,
        userId: ctx.user.id,
        items: shoppingItems as ShoppingItem[],
        isCompleted: 0,
      });

      return {
        menuId: (menuResult as any).insertId,
        listId: (listResult as any).insertId,
        menuData,
        nutritionSummary,
        shoppingItems,
      };
    }),

  regenerateDay: protectedProcedure
    .input(z.object({
      menuId: z.number().int(),
      day: z.string(), // "monday", "tuesday", etc.
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement day regeneration
      throw new Error("Not implemented yet");
    }),

  adjustMenu: protectedProcedure
    .input(z.object({
      menuId: z.number().int(),
      day: z.string(),
      mealType: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
      newMeal: z.any(), // Meal object
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement menu adjustment
      throw new Error("Not implemented yet");
    }),
});
