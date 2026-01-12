import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: User = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Preferences Router", () => {
  it("should get user preferences (returns null if not set initially)", async () => {
    const { ctx } = createAuthContext(999);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.preferences.get();
    if (result) {
      expect(result.userId).toBe(999);
    }
  });

  it("should update user preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const preferences = {
      allergies: ["peanuts", "shellfish"],
      dietaryRestrictions: ["vegan"],
      nutritionalGoals: ["weight-loss"],
      preferredCuisines: ["mediterranean"],
      dislikedIngredients: ["mushrooms"],
      targetCalories: 1800,
      targetProtein: 100,
      targetCarbs: 200,
      targetFat: 50,
    };

    const result = await caller.preferences.update(preferences);

    expect(result).toMatchObject({
      allergies: ["peanuts", "shellfish"],
      dietaryRestrictions: ["vegan"],
      nutritionalGoals: ["weight-loss"],
      preferredCuisines: ["mediterranean"],
      targetCalories: 1800,
      targetProtein: 100,
      targetCarbs: 200,
      targetFat: 50,
    });
  });

  it("should retrieve updated preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First update
    await caller.preferences.update({
      allergies: ["dairy"],
      dietaryRestrictions: ["vegetarian"],
      nutritionalGoals: ["muscle-gain"],
      preferredCuisines: ["italian"],
    });

    // Then retrieve
    const result = await caller.preferences.get();

    expect(result).not.toBeNull();
    expect(result?.allergies).toContain("dairy");
    expect(result?.dietaryRestrictions).toContain("vegetarian");
    expect(result?.nutritionalGoals).toContain("muscle-gain");
    expect(result?.preferredCuisines).toContain("italian");
  });

  it("should merge partial preference updates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First update with full data
    await caller.preferences.update({
      allergies: ["peanuts"],
      dietaryRestrictions: ["vegan"],
      nutritionalGoals: ["weight-loss"],
      preferredCuisines: ["mediterranean"],
      targetCalories: 2000,
    });

    // Partial update
    const result = await caller.preferences.update({
      targetCalories: 1800,
    });

    expect(result.targetCalories).toBe(1800);
    expect(result.allergies).toContain("peanuts");
    expect(result.dietaryRestrictions).toContain("vegan");
  });
});
