import { pool } from '../config/database.js';
export async function listDepartments(){const [rows]=await pool.execute('SELECT id, name, description FROM departments ORDER BY name');return rows}
