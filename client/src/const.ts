export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const OAUTH_SERVER_URL =
  import.meta.env.VITE_OAUTH_SERVER_URL ?? "http://localhost:4000"

export function getLoginUrl() {
  return new URL("/login", OAUTH_SERVER_URL).toString()
}

