#!/usr/bin/env tsx
/*
  scripts/seed-db.ts
  Inserts a dev user if missing and optionally prints a session token.

  Usage:
    pnpm dlx tsx ./scripts/seed-db.ts            # inserts local:1
    pnpm dlx tsx ./scripts/seed-db.ts local:1    # custom openId
    pnpm dlx tsx ./scripts/seed-db.ts --token     # also prints a session token
*/

import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const args = process.argv.slice(2);
  const openIdArg = args.find(a => !a.startsWith('--')) || 'local:1';
  const makeToken = args.includes('--token') || args.includes('-t');

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL in environment');
    process.exitCode = 2;
    return;
  }

  const conn = await mysql.createConnection({ uri: DATABASE_URL });
  try {
    const [rows] = await conn.query(`SELECT id FROM users WHERE openId = ? LIMIT 1`, [openIdArg]);
    const exists = Array.isArray(rows) && rows.length > 0;

    // Check whether the `password` column exists in the current schema
    const [cols] = await conn.query("SHOW COLUMNS FROM `users` LIKE 'password'");
    const hasPasswordColumn = Array.isArray(cols) && cols.length > 0;

    if (exists) {
      console.log('User already exists:', openIdArg);

      if (hasPasswordColumn) {
        // If user exists but has no password, set a deterministic dev password
        const [r] = await conn.query('SELECT password FROM users WHERE openId = ? LIMIT 1', [openIdArg]);
        const current = Array.isArray(r) && r.length > 0 ? (r as any[])[0].password : null;
        if (!current) {
          const crypto = await import('crypto');
          const plain = 'dev';
          const salt = 'dev-salt';
          const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
          const stored = `scrypt$${salt}$${hash}`;
          await conn.query('UPDATE users SET password = ? WHERE openId = ?', [stored, openIdArg]);
          console.log('Set dev password for existing user (openId=' + openIdArg + ') — password: dev');
        }
      }
    } else {
      // Insert new dev user; include password if the column exists
      let insertSql = `INSERT INTO users (openId, name, email, loginMethod, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())`;
      const params: any[] = [openIdArg, 'Dev User', 'dev@example.com', 'manus'];

      if (hasPasswordColumn) {
        const crypto = await import('crypto');
        const plain = 'dev';
        const salt = 'dev-salt';
        const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
        const stored = `scrypt$${salt}$${hash}`;

        insertSql = `INSERT INTO users (openId, name, email, loginMethod, password, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`;
        params.splice(3, 0, stored);
      }

      await conn.query(insertSql, params);
      console.log('Inserted dev user:', openIdArg, hasPasswordColumn ? '(password set: dev)' : '');
    }

    if (makeToken) {
      // import server sdk to sign a session token (uses JWT_SECRET from .env)
      try {
        // dynamic import so script still works if run in environments w/o TS path mapping
        const { sdk } = await import('../server/_core/sdk');
        const token = await sdk.createSessionToken(openIdArg);
        console.log('\nSession token (HTTP-only cookie should be set by the server):\n');
        console.log(token, '\n');
        console.log('To add token manually in browser (only for quick dev tests, not HttpOnly):');
        console.log("document.cookie = `${encodeURIComponent('manus_session')}=${token}; path=/; samesite=lax`;`\n");
      } catch (err) {
        console.warn('Could not generate token via server SDK (you can still use DB seed). Error:', String(err));
      }
    }

    console.log('\nDone.');
  } finally {
    await conn.end();
  }
}

void main();
