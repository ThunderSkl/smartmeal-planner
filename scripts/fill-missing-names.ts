#!/usr/bin/env tsx
/* scripts/fill-missing-names.ts
   Convenience script to fill missing `name` values for existing users.
   Usage: pnpm dlx tsx ./scripts/fill-missing-names.ts
*/

import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL in environment');
    process.exitCode = 2;
    return;
  }

  const conn = await mysql.createConnection({ uri: DATABASE_URL });
  try {
    const [res] = await conn.execute(`
      UPDATE users
      SET name = SUBSTRING_INDEX(email, '@', 1)
      WHERE (name IS NULL OR TRIM(name) = '')
        AND email IS NOT NULL
        AND TRIM(email) <> ''
    `);
    const affected = (res as any).affectedRows ?? 0;
    console.log(`Updated ${affected} user(s) with derived names`);
  } finally {
    await conn.end();
  }
}

void main();
