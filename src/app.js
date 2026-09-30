const express = require('express');
const fs = require('fs');
const path = require('path');

const VERSION = '0.1.0';

async function runMigrations(pool) {
  const migrationPath = path.join(__dirname, '..', 'migrations', '0001_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await pool.query(sql);
}

function createApp(pool, { servedBy }) {
  const app = express();

  app.get('/', (req, res) => {
    res.json({ version: VERSION, served_by: servedBy });
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

  return app;
}

module.exports = { createApp, runMigrations, VERSION };
