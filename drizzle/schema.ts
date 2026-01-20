// Lightweight, runtime-free schema types so the project can be used without Drizzle ORM.
// This file intentionally *replaces* the previous Drizzle table definitions with plain
// TypeScript types that match the database schema used in production.

/** Core user table */
export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod?: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export type InsertUser = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastSignedIn'>> & { openId: string };

/** User preferences */
export interface UserPreferences {
  id: number;
  userId: number;
  allergies: string[];
  dietaryRestrictions: string[];
  nutritionalGoals: string[];
  preferredCuisines: string[];
  dislikedIngredients: string[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  mealsPerDay: number;
  includeSnacks: number;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertUserPreferences = Omit<Partial<UserPreferences>, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

/** Menu & shopping types */
export interface Meal {
  name: string;
  description: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
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
  unit: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
}

export interface WeeklyMenu {
  id: number;
  userId: number;
  menuData: Record<string, DayMenu>;
  nutritionSummary: NutritionSummary;
  startDate: Date;
  isActive: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertWeeklyMenu = Omit<Partial<WeeklyMenu>, 'id' | 'createdAt' | 'updatedAt'> & { userId: number; menuData: Record<string, DayMenu>; nutritionSummary: NutritionSummary; startDate: Date };

export interface ShoppingList {
  id: number;
  weeklyMenuId: number;
  userId: number;
  items: ShoppingItem[];
  isCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertShoppingList = Omit<Partial<ShoppingList>, 'id' | 'createdAt' | 'updatedAt'> & { weeklyMenuId: number; userId: number; items: ShoppingItem[] };
