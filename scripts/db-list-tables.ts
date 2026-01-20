import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL');
    process.exit(2);
  }

  const conn = await mysql.createConnection({ uri: DATABASE_URL });
  try {
    const [tables] = await conn.query("SHOW TABLES");
    console.log('Tables:');
    console.log(JSON.stringify(tables, null, 2));

    for (const row of tables as any[]) {
      const tableName = Object.values(row)[0] as string;
      const [create] = await conn.query("SHOW CREATE TABLE `" + tableName + "`");
      console.log('\n--- ' + tableName + ' ---');
      console.log((create as any)[0]['Create Table']);
    }
  } finally {
    await conn.end();
  }
}

void main().catch(err => { console.error(err); process.exit(1); });