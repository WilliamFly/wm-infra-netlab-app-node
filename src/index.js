const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const SERVED_BY = process.env.SERVED_BY || 'netlab-app-node';
const VERSION = '0.1.0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const migrationPath = path.join(__dirname, '..', 'migrations', '0001_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await pool.query(sql);
}

const app = express();

app.get('/', (req, res) => {
  res.json({ version: VERSION, served_by: SERVED_BY });
});

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

app.get('/visits', async (req, res) => {
  try {
    await pool.query('INSERT INTO visits DEFAULT VALUES');
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM visits');
    res.json({ visits: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});

async function main() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`${SERVED_BY} listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
