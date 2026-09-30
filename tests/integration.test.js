const test = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { createApp, runMigrations } = require('../src/app');

async function spawnTestServer() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await runMigrations(pool);
  const app = createApp(pool, { servedBy: 'netlab-app-node-test' });

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)).then(() => pool.end()),
  };
}

test('GET / returns version and served_by', async () => {
  const { baseUrl, close } = await spawnTestServer();
  try {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.version, '0.1.0');
    assert.equal(body.served_by, 'netlab-app-node-test');
  } finally {
    await close();
  }
});

test('GET /health returns 200', async () => {
  const { baseUrl, close } = await spawnTestServer();
  try {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
  } finally {
    await close();
  }
});

test('GET /visits increments on each call', async () => {
  const { baseUrl, close } = await spawnTestServer();
  try {
    const first = await (await fetch(`${baseUrl}/visits`)).json();
    const second = await (await fetch(`${baseUrl}/visits`)).json();
    assert.equal(second.visits, first.visits + 1);
  } finally {
    await close();
  }
});
