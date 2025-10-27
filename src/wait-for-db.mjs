import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

const url = process.env.DB_URL;
if (!url) {
  console.error('DB_URL is not set');
  process.exit(1);
}

const timeoutMs = parseInt(process.env.DB_TIMEOUT_MS || '60000');
const pollIntervalMs = parseInt(process.env.DB_POLL_INTERVAL_MS || '2000');
const until = Date.now() + timeoutMs;
let attempts = 0;

(async function poll() {
  console.log(
    `Waiting for database connection (timeout: ${timeoutMs}ms, poll interval: ${pollIntervalMs}ms)...`,
  );

  while (Date.now() < until) {
    attempts++;
    const client = new Client({ connectionString: url });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log(`Database is reachable after ${attempts} attempt(s)`);
      return;
    } catch (error) {
      await client.end().catch(() => {}); // Ensure client is closed even if it failed to connect
      console.log(
        `Attempt ${attempts}: Waiting for database... (${error instanceof Error ? error.message : 'Unknown error'})`,
      );

      if (Date.now() + pollIntervalMs >= until) {
        console.error(
          `Timed out waiting for database after ${attempts} attempts`,
        );
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  console.error(`Timed out waiting for database after ${attempts} attempts`);
  process.exit(1);
})();
