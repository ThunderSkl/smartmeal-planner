#!/usr/bin/env tsx
/*
  scripts/import-schema.ts
  Cross-platform SQL importer for local MySQL (reads DATABASE_URL from .env).

  Usage:
    pnpm dlx tsx ./scripts/import-schema.ts               # uses ./drizzle/0000_reflective_deadpool.sql
    pnpm dlx tsx ./scripts/import-schema.ts ./path.sql    # custom file
*/

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

async function main() {
  const fileArg = process.argv[2] || './scripts/migrations/0000_reflective_deadpool.sql'; // default moved from previous ORM artifact location
  const filePath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(filePath)) {
    console.error('SQL file not found:', filePath);
    process.exitCode = 2;
    return;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Missing DATABASE_URL in environment');
    process.exitCode = 3;
    return;
  }

  console.log('Importing', filePath);

  // Remove CLI/kit-specific annotation lines that are not valid SQL
  // (e.g. `--> statement-breakpoint`) so the SQL can be executed by MySQL.
  const cleanedSql = sql
    .split(/\r?\n/)
    .filter(line => !line.trim().startsWith('-->'))
    .join('\n');

  let conn;
  try {
    conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

    // Make import idempotent: detect CREATE TABLE names and DROP them first so
    // repeated imports don't fail due to existing tables (safe for dev only).
    const tableNames = Array.from(cleanedSql.matchAll(/CREATE\s+TABLE\s+`([^`]+)`/gi)).map(m => m[1]);
    if (tableNames.length > 0) {
      console.log('[import-schema] Dropping existing tables if present:', tableNames.join(', '));
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const t of tableNames) {
        await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
      }
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    // Run the cleaned SQL in one go (file contains CREATE TABLE ... statements)
    await conn.query(cleanedSql);
    console.log('Import completed successfully');
  } catch (err: any) {
    console.error('Import failed:', err.message ?? err);
    process.exitCode = 4;
  } finally {
    if (conn) await conn.end();
  }
}

void main();
