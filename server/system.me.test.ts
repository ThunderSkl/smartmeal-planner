import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("system.me", () => {
  it("returns null for anonymous requests", async () => {
    const ctx: TrpcContext = {
      req: { protocol: "https", headers: {} } as TrpcContext['req'],
      res: {} as TrpcContext['res'],
      user: null,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.system.me();
    expect(result).toBeNull();
  });

  it("returns the user when present in context", async () => {
    const user = {
      id: 1,
      openId: "u-1",
      email: "u@example.com",
      name: "U",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as NonNullable<TrpcContext['user']>;

    const ctx: TrpcContext = {
      req: { protocol: "https", headers: {} } as TrpcContext['req'],
      res: {} as TrpcContext['res'],
      user,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.system.me();
    expect(result).toEqual(user);
  });
});
