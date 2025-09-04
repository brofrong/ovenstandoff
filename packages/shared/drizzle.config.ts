
import { defineConfig } from 'drizzle-kit';
import { env } from './src/utils/env';
import path from 'path';
import fs from 'fs';

// Ensure DB directory exists
const dbDir = path.dirname(env.DB_FILE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}


let schemaPath = path.join(__dirname, './src/config.schema.ts');

// if (__dirname.includes('packages/shared')) {
//   schemaPath = path.join(__dirname, 'packages/shared/src/*.schema.ts');
// }



export default defineConfig({
  out: './drizzle',
  schema: schemaPath,
  dialect: 'sqlite',

  dbCredentials: {
    url: env.DB_FILE_PATH,
  },
});
