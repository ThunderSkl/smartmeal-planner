import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User dietary preferences and restrictions
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Allergies as JSON array: ["peanuts", "shellfish", "dairy"]
  allergies: json("allergies").$type<string[]>().notNull(),
  // Dietary restrictions: "vegan", "vegetarian", "gluten-free", "keto", "paleo", "none"
  dietaryRestrictions: json("dietaryRestrictions").$type<string[]>().notNull(),
  // Nutritional goals: "weight-loss", "muscle-gain", "maintenance", "athletic-performance"
  nutritionalGoals: json("nutritionalGoals").$type<string[]>().notNull(),
  // Preferred cuisines: ["mediterranean", "asian", "mexican", "italian"]
  preferredCuisines: json("preferredCuisines").$type<string[]>().notNull(),
  // Disliked ingredients/foods
  dislikedIngredients: json("dislikedIngredients").$type<string[]>().notNull(),
  // Daily calorie target
  targetCalories: int("targetCalories").default(2000),
  // Protein target in grams
  targetProtein: int("targetProtein").default(50),
  // Carbs target in grams
  targetCarbs: int("targetCarbs").default(250),
  // Fat target in grams
  targetFat: int("targetFat").default(65),
  // Number of meals per day
  mealsPerDay: int("mealsPerDay").default(3),
  // Include snacks
  includeSnacks: int("includeSnacks").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

/**
 * Generated weekly menus
 */
export const weeklyMenus = mysqlTable("weeklyMenus", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Menu data as JSON: { monday: { breakfast: [...], lunch: [...], dinner: [...], snacks: [...] }, ... }
  menuData: json("menuData").$type<Record<string, DayMenu>>().notNull(),
  // Nutritional summary for the week
  nutritionSummary: json("nutritionSummary").$type<NutritionSummary>().notNull(),
  // Start date of the week
  startDate: timestamp("startDate").notNull(),
  // Whether this is the current active menu
  isActive: int("isActive").default(0),
  // Notes or custom modifications
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyMenu = typeof weeklyMenus.$inferSelect;
export type InsertWeeklyMenu = typeof weeklyMenus.$inferInsert;

/**
 * Shopping list generated from weekly menu
 */
export const shoppingLists = mysqlTable("shoppingLists", {
  id: int("id").autoincrement().primaryKey(),
  weeklyMenuId: int("weeklyMenuId").notNull(),
  userId: int("userId").notNull(),
  // Shopping list items as JSON
  items: json("items").$type<ShoppingItem[]>().notNull(),
  // Whether the list has been checked/completed
  isCompleted: int("isCompleted").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = typeof shoppingLists.$inferInsert;

/**
 * Type definitions for menu structure
 */
export interface Meal {
  name: string;
  description: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number; // in minutes
  difficulty: "easy" | "medium" | "hard";
  recipe?: string;
}

export interface DayMenu {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks?: Meal[];
}

export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  averageCaloriesPerDay: number;
  averageProteinPerDay: number;
  averageCarbsPerDay: number;
  averageFatPerDay: number;
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string; // "kg", "g", "ml", "l", "pieces", etc.
  category: string; // "produce", "dairy", "meat", "pantry", etc.
  checked: boolean;
  estimatedCost?: number;
}
