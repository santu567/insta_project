import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://insta_link:insta_link_secret@localhost:5433/insta_link',
});

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS oauth_sessions (
      id UUID PRIMARY KEY,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      user_id UUID,
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("Table created!");
  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
