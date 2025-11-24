import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is required. Please set it in your environment or .env file.',
  );
}

export default defineConfig({
  schema: './src/drizzle/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
