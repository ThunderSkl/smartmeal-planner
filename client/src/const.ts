export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Runtime-aware login URL helper. In production it returns the OAuth server /login.
// In development it falls back to the client-side `/login` when the OAuth server
// isn't configured or appears to be on a different origin — this makes local
// developer iterations (and your manual testing) much easier.
const DEFAULT_OAUTH = import.meta.env.VITE_OAUTH_SERVER_URL ?? "http://localhost:4000";

export function getLoginUrl() {
  try {
    const oauth = import.meta.env.VITE_OAUTH_SERVER_URL ?? DEFAULT_OAUTH;

    // If not configured, prefer client route
    if (!oauth) return "/login";

    // Runtime origin (browser only). When used on server this will throw and we
    // will fall back to the OAuth server URL (safe default).
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      try {
        const oauthUrl = new URL(oauth);
        const loc = window.location;
        // If OAuth server hostname differs from current host and we're in DEV,
        // prefer the client `/login` so the developer can reach the page.
        if (oauthUrl.hostname !== loc.hostname || oauthUrl.port !== loc.port) {
          return "/login";
        }
      } catch (err) {
        return "/login";
      }
    }

    return new URL("/login", oauth).toString();
  } catch {
    return "/login";
  }
}

