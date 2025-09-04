
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { configTable, runnerTable } from './config.schema';
import { env } from './utils/env';


const sqlite = new Database(env.DB_FILE_PATH);
export const db = drizzle({
  client: sqlite, schema: {
    configTable,
    runnerTable,
  }
});
