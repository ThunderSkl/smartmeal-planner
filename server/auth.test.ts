// Ensure env required by server modules is present BEFORE imports
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-please-change';
process.env.OAUTH_SERVER_URL = process.env.OAUTH_SERVER_URL || 'http://localhost:1';

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

function makeCtx() {
  const cookies: Record<string, string> = {};
  return {
    req: { protocol: "https", headers: {} } as any,
    res: { cookie: (name: string, value: string) => (cookies[name] = value) } as any,
  } as any;
}

describe("auth.register / auth.login (email/password)", () => {
  const testEmail = `test+${Date.now()}@example.com`;
  const openId = `email:${testEmail}`;

  // Ensure test environment has a JWT secret and a benign OAUTH_SERVER_URL to avoid noisy warnings
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-please-change';
  process.env.OAUTH_SERVER_URL = process.env.OAUTH_SERVER_URL || 'http://localhost:1';

  it("registers a new user and sets a session cookie", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx as any);

    // Avoid depending on JOSE signing in unit test environment by stubbing session creation
    const sdkModule = await import('./_core/sdk');
    const origCreate = sdkModule.sdk.createSessionToken;
    sdkModule.sdk.createSessionToken = async () => 'test-session-token';

    await caller.auth.register({ name: "Test User", email: testEmail, password: "hunter2" });

    // restore
    sdkModule.sdk.createSessionToken = origCreate;

    const user = await db.getUserByOpenId(openId);
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail.toLowerCase());
  });

  it("allows login with correct password", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx as any);

    // stub session creation as above
    const sdkModule = await import('./_core/sdk');
    const origCreate = sdkModule.sdk.createSessionToken;
    sdkModule.sdk.createSessionToken = async () => 'test-session-token';

    const res = await caller.auth.login({ email: testEmail, password: "hunter2" });
    expect(res).toHaveProperty('success', true);
    expect(res).toHaveProperty('user');
    expect(res.user?.email).toBe(testEmail.toLowerCase());

    sdkModule.sdk.createSessionToken = origCreate;
  });

  // cleanup (best effort)
  it("cleans up created user", async () => {
    const u = await db.getUserByOpenId(openId);
    if (u) {
      const pool = await db.getDb();
      if (pool) {
        await (pool as any).execute('DELETE FROM users WHERE openId = ?', [openId]);
      }
    }
  });
});
