export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
};

// Fail-fast / helpful dev message when critical auth env vars are missing.
// Tests set JWT_SECRET explicitly, so we only warn/throw outside of tests.
if (!ENV.appId || !ENV.cookieSecret) {
  const msg = `[ENV] Missing required environment variables: VITE_APP_ID=${ENV.appId ? 'OK' : 'MISSING'} JWT_SECRET=${ENV.cookieSecret ? 'OK' : 'MISSING'}.\n` +
    "Authentication will fail — set these in your environment or a .env file. See .env.example.";
  // Always log so developer sees it in console
  console.error(msg);
  // In production crash fast. In dev, keep running but clearly warn.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  }
}
