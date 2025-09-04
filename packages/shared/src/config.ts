
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { configTable, runnerTable } from './config.schema';
import { env } from './utils/env';
import path from 'path';
import fs from 'fs';

// Ensure DB directory exists
const dbDir = path.dirname(env.DB_FILE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(env.DB_FILE_PATH);
export const db = drizzle({
  client: sqlite, schema: {
    configTable,
    runnerTable,
  }
});
