import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('[db-clean] Missing DATABASE_URL in environment');
    process.exit(2);
  }

  // Derive a server-only URI (remove database path) and the database name
  const match = DATABASE_URL.match(/^mysql:\/\/([^@]+)@([^/]+)\/(.+)$/);
  if (!match) {
    console.error('[db-clean] DATABASE_URL does not match expected pattern');
    console.error(DATABASE_URL);
    process.exit(2);
  }

  const creds = match[1];
  const hostAndPort = match[2];
  const dbName = match[3].split('?')[0];
  const serverUri = `mysql://${creds}@${hostAndPort}/`;

  console.log(`[db-clean] Recreating database '${dbName}' using server ${hostAndPort}`);

  const conn = await mysql.createConnection({ uri: serverUri });
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await conn.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    console.log('[db-clean] Database recreated successfully');
  } finally {
    await conn.end();
  }
}

void main().catch(err => {
  console.error('[db-clean] Failed:', String(err));
  process.exit(1);
});
