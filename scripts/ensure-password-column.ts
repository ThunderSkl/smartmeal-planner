import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL');
    process.exit(2);
  }

  const conn = await mysql.createConnection({ uri: DATABASE_URL });
  try {
    // Check if column exists
    const [rows] = await conn.query("SHOW COLUMNS FROM `users` LIKE 'password'");
    if (Array.isArray(rows) && rows.length > 0) {
      console.log('[ensure-password-column] `password` column already exists');
      return;
    }

    const sqlPath = path.resolve(process.cwd(), './scripts/migrations/0001_restore_password_column.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error('[ensure-password-column] Migration file not found:', sqlPath);
      process.exit(3);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('[ensure-password-column] Applying migration to add password column');
    try {
      await conn.query(sql);
      console.log('[ensure-password-column] ALTER applied');
    } catch (err: any) {
      // Ignore "duplicate column" or other harmless errors; rethrow others
      const msg = String(err?.message ?? err);
      if (/Duplicate column name|already exists/i.test(msg)) {
        console.log('[ensure-password-column] Column already exists (race) — ok');
      } else {
        throw err;
      }
    }

    // Try creating a small index for the password column if supported
    try {
      await conn.query('CREATE INDEX users_password_idx ON `users` (`password`)');
      console.log('[ensure-password-column] Created index users_password_idx');
    } catch (err: any) {
      console.log('[ensure-password-column] Could not create index (ignored):', String(err?.message ?? err));
    }
  } finally {
    await conn.end();
  }
}

void main().catch(err => { console.error(err); process.exit(1); });