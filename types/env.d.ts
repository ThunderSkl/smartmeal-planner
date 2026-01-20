// types/env.d.ts — declare the env vars the app expects
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    VITE_GOOGLE_CLIENT_ID?: string;
    VITE_OAUTH_SERVER_URL?: string;
    OWNER_OPEN_ID?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  }
}
