import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import * as schema from './schema';

const dbPath =
  process.env.DB_PATH || resolve(__dirname, '..', 'data', 'whatsapp.db');

if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: resolve(process.cwd(), 'drizzle') });

export { schema };
