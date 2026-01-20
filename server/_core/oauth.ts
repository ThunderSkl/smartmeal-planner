import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

import axios from "axios";
import { ENV } from "./env";

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Accept id_token from client (Google Sign-In) and create a server session.
  app.post("/api/oauth/google", async (req: Request, res: Response) => {
    const idToken = (req.body && (req.body as any).id_token) || undefined;
    if (!idToken) {
      res.status(400).json({ error: "id_token is required" });
      return;
    }

    try {
      // Verify token with Google tokeninfo endpoint (simple and reliable for now)
      const { data } = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
        params: { id_token: idToken },
        timeout: 5000,
      });

      const aud = (data as any).aud as string | undefined;
      const sub = (data as any).sub as string | undefined;
      const email = (data as any).email as string | undefined;
      const name = (data as any).name as string | undefined;

      const configured = ENV.googleClientId || process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
      if (!configured) {
        console.warn("[OAuth][Google] GOOGLE_CLIENT_ID not configured on server");
      }

      if (!sub || !aud || (configured && aud !== configured)) {
        console.warn("[OAuth][Google] token validation failed", { aud, sub });
        res.status(400).json({ error: "Invalid Google ID token" });
        return;
      }

      const openId = `google:${sub}`;

      await db.upsertUser({
        openId,
        name: name ?? null,
        email: email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, { name: name ?? "", expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true });
    } catch (err) {
      console.error("[OAuth][Google] failed to verify id_token", err);
      res.status(400).json({ error: "Invalid id_token" });
    }
  });

  // DEV: create a local session cookie quickly for development (only in DEV)
  app.get('/dev/fake-login', async (req: Request, res: Response) => {
    if (ENV.isProduction) return res.status(404).send('not found');

    const openId = (req.query.openId as string) || 'local:1';
    const redirectTo = (req.query.redirect as string) || '/';

    try {
      await db.upsertUser({
        openId,
        name: 'Dev User',
        email: 'dev@example.com',
        loginMethod: 'manus',
        lastSignedIn: new Date(),
      });

      const token = await sdk.createSessionToken(openId, { name: 'Dev User', expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, redirectTo);
    } catch (err) {
      console.error('[DEV][fake-login] failed', err);
      res.status(500).json({ error: 'fake-login failed' });
    }
  });
}

