import mysql from 'mysql2/promise';
import { ENV } from './_core/env';


type Nullable<T> = T | null;

interface InsertUser {
  openId: string;
  name?: Nullable<string>;
  email?: Nullable<string>;
  role?: string;
  lastSignedIn?: string | Date;
  loginMethod?: Nullable<string>;
}

interface User extends InsertUser {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

interface UserPreferences {
  userId: number;
  allergies: string[];
  dietaryRestrictions: string[];
  nutritionalGoals: any[];
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

type InsertUserPreferences = Partial<
  Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>
> & { userId?: number };

interface WeeklyMenu {
  id: number;
  userId: number;
  menuData: any;
  nutritionSummary: any;
  startDate: Date;
  isActive: number;
  notes?: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertWeeklyMenu {
  userId: number;
  menuData: any;
  nutritionSummary: any;
  startDate: string | Date;
  isActive?: number;
  notes?: Nullable<string>;
}

interface ShoppingItem {
  id: string | number | undefined;
  category: string;
  checked: any;
  estimatedCost: null;
  name: string;
  qty?: number;
  unit?: string;
  notes?: string;
}

interface ShoppingList {
  id: number;
  weeklyMenuId: number;
  userId: number;
  items: ShoppingItem[];
  isCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertShoppingList {
  weeklyMenuId: number;
  userId: number;
  items: ShoppingItem[];
  isCompleted?: number;
}

let _pool: mysql.Pool | null = null;

async function getPool() {
  if (_pool) return _pool;
  const uri = process.env.DATABASE_URL || ENV.databaseUrl;
  if (!uri) return null;
  try {
    _pool = mysql.createPool({
      uri,
      connectionLimit: 5,
      stringifyObjects: false,
      decimalNumbers: true,
    });
    // quick ping
    await _pool.query('SELECT 1');
    return _pool;
  } catch (err) {
    console.warn('[Database] connection failed:', String(err));
    _pool = null;
    return null;
  }
}

export async function getDb() {
  return getPool();
}

// -------------------- USERS --------------------
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error('User openId is required for upsert');
  const pool = await getPool();
  if (!pool) {
    console.warn('[Database] Cannot upsert user: database not available');
    return;
  }

  const lastSignedInRaw = (user as Partial<User> & { lastSignedIn?: string | Date }).lastSignedIn;
  const lastSignedIn = lastSignedInRaw ? new Date(lastSignedInRaw) : new Date();
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user');

  // Support optional `password` in upsert so callers (register/login) can set it.
  const sql = `
    INSERT INTO users (openId, name, email, loginMethod, role, password, lastSignedIn)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      email = VALUES(email),
      loginMethod = VALUES(loginMethod),
      role = VALUES(role),
      password = IF(VALUES(password) IS NOT NULL, VALUES(password), password),
      lastSignedIn = VALUES(lastSignedIn),
      updatedAt = NOW()
  `;

  await pool.execute(sql, [
    user.openId,
    user.name ?? null,
    user.email ?? null,
    (user as any).loginMethod ?? null,
    role,
    (user as any).password ?? null,
    lastSignedIn,
  ]);
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const pool = await getPool();
  if (!pool) return undefined;
  const [rows] = await pool.execute<any[]>('SELECT * FROM users WHERE openId = ? LIMIT 1', [openId]);
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const row = rows[0];
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    lastSignedIn: new Date(row.lastSignedIn),
  } as User;
}

// -------------------- PREFERENCES --------------------
export async function getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
  const pool = await getPool();
  if (!pool) return undefined;
  const [rows] = await pool.execute<any[]>('SELECT * FROM userPreferences WHERE userId = ? LIMIT 1', [userId]);
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const r = rows[0];
  const parseJsonOrCsv = (v: any) => {
    if (v == null) return [];
    if (typeof v === 'object') return v;
    if (typeof v !== 'string') return [];
    // Try JSON first, then fall back to legacy CSV (comma-separated values)
    try {
      return JSON.parse(v);
    } catch {
      if (v.trim() === '') return [];
      return v.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  };

  return {
    ...r,
    allergies: parseJsonOrCsv(r.allergies),
    dietaryRestrictions: parseJsonOrCsv(r.dietaryRestrictions),
    nutritionalGoals: parseJsonOrCsv(r.nutritionalGoals),
    preferredCuisines: parseJsonOrCsv(r.preferredCuisines),
    dislikedIngredients: parseJsonOrCsv(r.dislikedIngredients),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  } as UserPreferences;
}

export async function upsertUserPreferences(userId: number, prefs: Omit<InsertUserPreferences, 'userId'>) {
  const pool = await getPool();
  if (!pool) {
    console.warn('[Database] Cannot upsert preferences: database not available');
    return;
  }

  const existing = await getUserPreferences(userId);
  const payload = {
    allergies: JSON.stringify(prefs.allergies ?? existing?.allergies ?? []),
    dietaryRestrictions: JSON.stringify(prefs.dietaryRestrictions ?? existing?.dietaryRestrictions ?? []),
    nutritionalGoals: JSON.stringify(prefs.nutritionalGoals ?? existing?.nutritionalGoals ?? []),
    preferredCuisines: JSON.stringify(prefs.preferredCuisines ?? existing?.preferredCuisines ?? []),
    dislikedIngredients: JSON.stringify(prefs.dislikedIngredients ?? existing?.dislikedIngredients ?? []),
    targetCalories: prefs.targetCalories ?? existing?.targetCalories ?? 2000,
    targetProtein: prefs.targetProtein ?? existing?.targetProtein ?? 50,
    targetCarbs: prefs.targetCarbs ?? existing?.targetCarbs ?? 250,
    targetFat: prefs.targetFat ?? existing?.targetFat ?? 65,
    mealsPerDay: prefs.mealsPerDay ?? existing?.mealsPerDay ?? 3,
    includeSnacks: prefs.includeSnacks ?? existing?.includeSnacks ?? 1,
  } as const;

  if (existing) {
    await pool.execute(
      `UPDATE userPreferences SET allergies = ?, dietaryRestrictions = ?, nutritionalGoals = ?, preferredCuisines = ?, dislikedIngredients = ?, targetCalories = ?, targetProtein = ?, targetCarbs = ?, targetFat = ?, mealsPerDay = ?, includeSnacks = ?, updatedAt = NOW() WHERE userId = ?`,
      [
        payload.allergies,
        payload.dietaryRestrictions,
        payload.nutritionalGoals,
        payload.preferredCuisines,
        payload.dislikedIngredients,
        payload.targetCalories,
        payload.targetProtein,
        payload.targetCarbs,
        payload.targetFat,
        payload.mealsPerDay,
        payload.includeSnacks,
        userId,
      ]
    );
  } else {
    await pool.execute(
      `INSERT INTO userPreferences (userId, allergies, dietaryRestrictions, nutritionalGoals, preferredCuisines, dislikedIngredients, targetCalories, targetProtein, targetCarbs, targetFat, mealsPerDay, includeSnacks, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        payload.allergies,
        payload.dietaryRestrictions,
        payload.nutritionalGoals,
        payload.preferredCuisines,
        payload.dislikedIngredients,
        payload.targetCalories,
        payload.targetProtein,
        payload.targetCarbs,
        payload.targetFat,
        payload.mealsPerDay,
        payload.includeSnacks,
      ]
    );
  }
}

// -------------------- WEEKLY MENUS --------------------
export async function createWeeklyMenu(menu: InsertWeeklyMenu) {
  const pool = await getPool();
  if (!pool) {
    console.warn('[Database] Cannot create menu: database not available');
    return undefined;
  }

  const [res] = await pool.execute<any[]>(
    `INSERT INTO weeklyMenus (userId, menuData, nutritionSummary, startDate, isActive, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [menu.userId, JSON.stringify(menu.menuData), JSON.stringify(menu.nutritionSummary), menu.startDate, menu.isActive ?? 0, menu.notes ?? null]
  );

  // mysql2 returns an OkPacket with insertId
  const insertId = (res as any).insertId;
  return insertId ? { id: insertId, ...menu } : res;
}

export async function getWeeklyMenu(menuId: number) {
  const pool = await getPool();
  if (!pool) return undefined;
  const [rows] = await pool.execute<any[]>('SELECT * FROM weeklyMenus WHERE id = ? LIMIT 1', [menuId]);
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const r = rows[0];
  return {
    ...r,
    menuData: JSON.parse(r.menuData),
    nutritionSummary: JSON.parse(r.nutritionSummary),
    startDate: new Date(r.startDate),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  } as WeeklyMenu;
}

export async function getUserWeeklyMenus(userId: number, limit: number = 10) {
  const pool = await getPool();
  if (!pool) return [];
  const [rows] = await pool.execute<any[]>('SELECT * FROM weeklyMenus WHERE userId = ? ORDER BY createdAt DESC LIMIT ?', [userId, limit]);
  return (rows as any[]).map(r => ({
    ...r,
    menuData: JSON.parse(r.menuData),
    nutritionSummary: JSON.parse(r.nutritionSummary),
    startDate: new Date(r.startDate),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  })) as WeeklyMenu[];
}

export async function getActiveWeeklyMenu(userId: number) {
  const pool = await getPool();
  if (!pool) return null;
  const [rows] = await pool.execute<any[]>('SELECT * FROM weeklyMenus WHERE userId = ? AND isActive = 1 LIMIT 1', [userId]);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r = rows[0];
  return {
    ...r,
    menuData: JSON.parse(r.menuData),
    nutritionSummary: JSON.parse(r.nutritionSummary),
    startDate: new Date(r.startDate),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  } as WeeklyMenu;
}

export async function updateWeeklyMenu(menuId: number, updates: Partial<InsertWeeklyMenu>) {
  const pool = await getPool();
  if (!pool) {
    console.warn('[Database] Cannot update menu: database not available');
    return;
  }

  const sets: string[] = [];
  const params: any[] = [];
  if (updates.menuData) { sets.push('menuData = ?'); params.push(JSON.stringify(updates.menuData)); }
  if (updates.nutritionSummary) { sets.push('nutritionSummary = ?'); params.push(JSON.stringify(updates.nutritionSummary)); }
  if (updates.notes !== undefined) { sets.push('notes = ?'); params.push(updates.notes); }
  if (sets.length === 0) return;
  sets.push('updatedAt = NOW()');

  const sql = `UPDATE weeklyMenus SET ${sets.join(', ')} WHERE id = ?`;
  params.push(menuId);
  await pool.execute(sql, params);
}

export async function setActiveWeeklyMenu(userId: number, menuId: number) {
  const pool = await getPool();
  if (!pool) {
    console.warn('[Database] Cannot set active menu: database not available');
    return;
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE weeklyMenus SET isActive = 0 WHERE userId = ?', [userId]);
    await conn.execute('UPDATE weeklyMenus SET isActive = 1 WHERE id = ? AND userId = ?', [menuId, userId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// -------------------- SHOPPING LISTS --------------------
export async function createShoppingList(list: InsertShoppingList) {
  const pool = await getPool();
  if (!pool) {
    console.warn('[Database] Cannot create shopping list: database not available');
    return undefined;
  }
  const [res] = await pool.execute<any[]>('INSERT INTO shoppingLists (weeklyMenuId, userId, items, isCompleted, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())', [list.weeklyMenuId, list.userId, JSON.stringify(list.items), list.isCompleted ?? 0]);
  const insertId = (res as any).insertId;
  return insertId ? { id: insertId, ...list } : res;
}

export async function getShoppingList(listId: number) {
  const pool = await getPool();
  if (!pool) return undefined;
  const [rows] = await pool.execute<any[]>('SELECT * FROM shoppingLists WHERE id = ? LIMIT 1', [listId]);
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const r = rows[0];
  return {
    ...r,
    items: JSON.parse(r.items),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  } as ShoppingList;
}

export async function getShoppingListByMenuId(weeklyMenuId: number) {
  const pool = await getPool();
  if (!pool) return undefined;
  const [rows] = await pool.execute<any[]>('SELECT * FROM shoppingLists WHERE weeklyMenuId = ? LIMIT 1', [weeklyMenuId]);
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const r = rows[0];
  return {
    ...r,
    items: JSON.parse(r.items),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  } as ShoppingList;
}

export async function updateShoppingList(listId: number, updates: Partial<InsertShoppingList>) {
  const pool = await getPool();
  if (!pool) {
    console.warn('[Database] Cannot update shopping list: database not available');
    return;
  }
  const sets: string[] = [];
  const params: any[] = [];
  if (updates.items) { sets.push('items = ?'); params.push(JSON.stringify(updates.items)); }
  if (updates.isCompleted !== undefined) { sets.push('isCompleted = ?'); params.push(updates.isCompleted); }
  if (sets.length === 0) return;
  sets.push('updatedAt = NOW()');
  params.push(listId);
  const sql = `UPDATE shoppingLists SET ${sets.join(', ')} WHERE id = ?`;
  await pool.execute(sql, params);
}

export async function getUserShoppingLists(userId: number) {
  const pool = await getPool();
  if (!pool) return [];

  const [rows] = await pool.execute<any[]>('SELECT * FROM shoppingLists WHERE userId = ? ORDER BY createdAt DESC', [userId]);
  return (rows as any[]).map(r => ({
    ...r,
    items: JSON.parse(r.items),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  })) as ShoppingList[];
}
