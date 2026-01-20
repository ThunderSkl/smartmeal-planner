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
    const [users] = await conn.query("SELECT id, openId FROM users WHERE openId = 'local:1' LIMIT 1");
    if (!Array.isArray(users) || users.length === 0) {
      console.log('No user local:1 found');
      return;
    }
    const userId = (users as any[])[0].id;
    console.log('userId for local:1 =', userId);

    const [prefs] = await conn.query('SELECT * FROM userPreferences WHERE userId = ? LIMIT 1', [userId]);
    console.log('userPreferences row:', JSON.stringify((prefs as any[])[0] ?? null, null, 2));
  } finally {
    await conn.end();
  }
}

void main().catch(err => { console.error(err); process.exit(1); });