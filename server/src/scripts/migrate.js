import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { env } from '../config/env.js';
const database=env.mysql.database;
if(!/^[A-Za-z0-9_]+$/.test(database)) throw new Error('MYSQL_DATABASE may contain only letters, numbers and underscores.');
const connection=await mysql.createConnection({...env.mysql,database:undefined,multipleStatements:true});
try {
 await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
 await connection.query(`USE \`${database}\``);
 await connection.query('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(190) NOT NULL PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
 for (const name of ['001_initial_schema.sql', '002_grievance_history_visibility.sql', '003_cmo_remarks_escalations.sql', '004_action_taken_reports.sql']) {
  const [found]=await connection.execute('SELECT name FROM schema_migrations WHERE name = ?',[name]);
  if(found.length){console.log(`${name} already applied.`);continue}
  if(name === '002_grievance_history_visibility.sql') {
   const [column]=await connection.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'grievance_history' AND COLUMN_NAME = 'citizen_visible'`, [database]);
   if(column.length) {
    await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)',[name]);
    console.log(`${name} already present; migration ledger updated.`); continue;
   }
  }
  const migrationPath=fileURLToPath(new URL(`../../database/migrations/${name}`,import.meta.url));
  const sql=await readFile(migrationPath,'utf8'); await connection.query(sql);
  await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)',[name]); console.log(`${name} applied.`);
 }
} finally { await connection.end(); }
