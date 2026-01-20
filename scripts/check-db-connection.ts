/*
  scripts/check-db-connection.ts
  - Safe, local-only DB connectivity checker. Does NOT modify data.
  - Usage: `pnpm dlx tsx ./scripts/check-db-connection.ts`

  IMPORTANT: I will NOT run this on your machine. Run it locally to verify
  your `DATABASE_URL` and connectivity before running import/seed/tests.
*/

import 'dotenv/config';
import { createPool } from 'mysql2/promise';

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('\n[ERROR] DATABASE_URL is not set in your environment (.env).');
  console.error('Set DATABASE_URL and re-run: pnpm dlx tsx ./scripts/check-db-connection.ts\n');
  process.exit(2);
}

async function main() {
  console.log('[INFO] Testing database connection using DATABASE_URL from environment...');

  try {
    const pool = createPool({ uri: url!, connectionLimit: 1, waitForConnections: true });

    // Lightweight smoke query
    const [rows] = await pool.query('SELECT 1 AS ok');

    console.log('\n✅ Connection successful — lightweight query passed.');
    console.log('Returned rows:', JSON.stringify(rows));

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n⛔ Connection failed:');

    // Friendly common errors mapping
    const msg = error?.message ?? String(error);
    console.error(msg);

    if (/ECONNREFUSED/i.test(msg)) {
      console.error('\n• Host refused the connection (is MySQL running on the host/port in DATABASE_URL?).');
    }
    if (/ER_ACCESS_DENIED_ERROR/i.test(msg) || /Access denied for user/i.test(msg)) {
      console.error("\n• Access denied — check username/password and user's privileges.");
    }
    if (/ER_BAD_DB_ERROR/i.test(msg) || /Unknown database/i.test(msg)) {
      console.error("\n• Unknown database — create the database or fix the DATABASE_URL database name.");
    }

    process.exit(1);
  }
}

main();
