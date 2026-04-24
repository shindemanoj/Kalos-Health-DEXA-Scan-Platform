// scripts/migrate.js — run all migrations in order
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIGRATIONS = [
  '001_create_users.sql',
  '002_create_scans.sql',
  '003_seed.sql',
];

async function migrate() {
  const client = await pool.connect();
  try {
    for (const file of MIGRATIONS) {
      const sql = fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8');
      console.log(`Running ${file}…`);
      await client.query(sql);
      console.log(`  ✓ ${file}`);
    }
    console.log('\nAll migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
