const { Pool } = require('pg');
const { createApp, runMigrations } = require('./app');

const PORT = process.env.PORT || 8080;
const SERVED_BY = process.env.SERVED_BY || 'netlab-app-node';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = createApp(pool, { servedBy: SERVED_BY });

async function main() {
  await runMigrations(pool);
  app.listen(PORT, () => {
    console.log(`${SERVED_BY} listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
