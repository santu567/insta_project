import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __rootDir = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(__rootDir, '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://insta_link:insta_link_secret@localhost:5433/insta_link',
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

// Auto-initialize required tables
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oauth_sessions (
        id UUID PRIMARY KEY,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        user_id UUID,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Auto-migrated oauth_sessions table');
  } catch (err) {
    console.error('⚠️ Failed to auto-migrate oauth_sessions table:', err.message);
  }
})();

export default pool;
