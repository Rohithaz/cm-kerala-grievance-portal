import { pool } from '../config/database.js';

const safeColumns = 'id, name, email, mobile, role, department_id, is_active';

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${safeColumns}, password_hash FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

export async function findSafeUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${safeColumns} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function createCitizenUser({ name, email, mobile, passwordHash }) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, mobile, password_hash, role, department_id)
     VALUES (?, ?, ?, ?, 'citizen', NULL)`,
    [name, email, mobile, passwordHash],
  );
  return findSafeUserById(result.insertId);
}

export async function updateSafeProfile(id, fields) {
  const assignments = [];
  const values = [];
  if (Object.hasOwn(fields, 'name')) { assignments.push('name = ?'); values.push(fields.name); }
  if (Object.hasOwn(fields, 'mobile')) { assignments.push('mobile = ?'); values.push(fields.mobile); }
  if (!assignments.length) return findSafeUserById(id);
  values.push(id);
  await pool.execute(`UPDATE users SET ${assignments.join(', ')} WHERE id = ?`, values);
  return findSafeUserById(id);
}