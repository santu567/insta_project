import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pg from 'pg';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __rootDir = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(__rootDir, '.env') });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://insta_link:insta_link_secret@localhost:5432/insta_link'
});

async function migrate() {
  try {
    await client.connect();
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
