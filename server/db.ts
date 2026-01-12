import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userPreferences, weeklyMenus, shoppingLists, type InsertUserPreferences, type InsertWeeklyMenu, type InsertShoppingList } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== USER PREFERENCES ====================

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserPreferences(userId: number, prefs: Omit<InsertUserPreferences, 'userId'>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert preferences: database not available");
    return;
  }

  const existing = await getUserPreferences(userId);

  if (existing) {
    await db
      .update(userPreferences)
      .set({
        ...prefs,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      ...prefs,
    });
  }
}

// ==================== WEEKLY MENUS ====================

export async function createWeeklyMenu(menu: InsertWeeklyMenu) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create menu: database not available");
    return undefined;
  }

  const result = await db.insert(weeklyMenus).values(menu);
  return result;
}

export async function getWeeklyMenu(menuId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(weeklyMenus)
    .where(eq(weeklyMenus.id, menuId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserWeeklyMenus(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(weeklyMenus)
    .where(eq(weeklyMenus.userId, userId))
    .orderBy(weeklyMenus.createdAt)
    .limit(limit);

  return result;
}

export async function getActiveWeeklyMenu(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(weeklyMenus)
    .where(and(eq(weeklyMenus.userId, userId), eq(weeklyMenus.isActive, 1)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateWeeklyMenu(menuId: number, updates: Partial<InsertWeeklyMenu>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update menu: database not available");
    return;
  }

  await db
    .update(weeklyMenus)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(weeklyMenus.id, menuId));
}

export async function setActiveWeeklyMenu(userId: number, menuId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot set active menu: database not available");
    return;
  }

  // First, deactivate all other menus for this user
  await db
    .update(weeklyMenus)
    .set({ isActive: 0 })
    .where(eq(weeklyMenus.userId, userId));

  // Then activate the selected menu
  await db
    .update(weeklyMenus)
    .set({ isActive: 1 })
    .where(eq(weeklyMenus.id, menuId));
}

// ==================== SHOPPING LISTS ====================

export async function createShoppingList(list: InsertShoppingList) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create shopping list: database not available");
    return undefined;
  }

  const result = await db.insert(shoppingLists).values(list);
  return result;
}

export async function getShoppingList(listId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.id, listId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getShoppingListByMenuId(weeklyMenuId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.weeklyMenuId, weeklyMenuId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateShoppingList(listId: number, updates: Partial<InsertShoppingList>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update shopping list: database not available");
    return;
  }

  await db
    .update(shoppingLists)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(shoppingLists.id, listId));
}

export async function getUserShoppingLists(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.userId, userId))
    .orderBy(shoppingLists.createdAt);

  return result;
}
