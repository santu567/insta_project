import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __rootDir = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(__rootDir, '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://insta_link:insta_link_secret@localhost:5433/insta_link',
  max: 10
});

export default pool;
