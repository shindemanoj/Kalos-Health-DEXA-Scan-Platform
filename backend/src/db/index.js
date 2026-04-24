const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Convenience wrapper — returns rows directly
async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

// Single row — throws if not found
async function queryOne(text, params) {
  const rows = await query(text, params);
  if (!rows.length) return null;
  return rows[0];
}

async function testConnection() {
  const client = await pool.connect();
  console.log('PostgreSQL connected');
  client.release();
}

module.exports = { pool, query, queryOne, testConnection };
