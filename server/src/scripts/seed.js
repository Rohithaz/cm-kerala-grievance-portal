import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/database.js';

try {
  const file = fileURLToPath(new URL('../../database/seeds/001_reference_data.sql', import.meta.url));
  const sql = await readFile(file, 'utf8');
  const statements = sql.split(';').map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await pool.query(statement);
  console.log('Reference districts and departments seeded.');
} finally {
  await pool.end();
}