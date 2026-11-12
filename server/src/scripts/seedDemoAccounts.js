import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { pool } from '../config/database.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const credentials = [
  { kind: 'cmo', email: env.demo.cmoEmail.trim().toLowerCase(), password: env.demo.cmoPassword, role: 'cmo_admin', departmentId: null },
  { kind: 'officer', email: env.demo.officerEmail.trim().toLowerCase(), password: env.demo.officerPassword, role: 'department_officer' },
];

if (env.nodeEnv === 'production') throw new Error('The demo-account seed is disabled in production.');
if (credentials.some((account) => !account.email || !account.password)) {
  console.log('Demo-account seed skipped: all four DEMO_* credentials must be configured.');
  process.exit(0);
}

const waterOfficerEmail = env.demo.waterOfficerEmail.trim().toLowerCase();
const waterOfficerPassword = env.demo.waterOfficerPassword;
if (Boolean(waterOfficerEmail) !== Boolean(waterOfficerPassword)) {
  throw new Error('Configure both Water Resources demo officer settings or leave both blank.');
}
if (waterOfficerEmail && waterOfficerPassword) {
  credentials.push({ kind: 'water_officer', email: waterOfficerEmail, password: waterOfficerPassword, role: 'department_officer' });
}

for (const account of credentials) {
  if (!emailPattern.test(account.email) || Buffer.byteLength(account.password, 'utf8') > 72 || account.password.length < 14) {
    throw new Error('Demo-account credentials are invalid; use valid emails and passwords of at least 14 characters.');
  }
}
if (new Set(credentials.map((account) => account.email)).size !== credentials.length) {
  throw new Error('Each configured demo account must use a different email address.');
}

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [departmentRows] = await connection.execute(
    'SELECT id, name FROM departments WHERE name IN (?, ?)',
    ['Public Works Department', 'Water Resources Department'],
  );
  const departmentIds = new Map(departmentRows.map((department) => [department.name, department.id]));
  if (!departmentIds.has('Public Works Department')) throw new Error('Seed the reference departments before demo accounts.');
  credentials[1].departmentId = departmentIds.get('Public Works Department');
  if (credentials[2] && !departmentIds.has('Water Resources Department')) {
    throw new Error('Water Resources Department is missing; seed the reference departments before demo accounts.');
  }
  if (credentials[2]) credentials[2].departmentId = departmentIds.get('Water Resources Department');

  for (const account of credentials) {
    const [existingRows] = await connection.execute(
      'SELECT id, role, department_id, is_active FROM users WHERE email = ? LIMIT 1 FOR UPDATE',
      [account.email],
    );
    if (existingRows.length) {
      if (account.kind === 'water_officer') {
        const existing = existingRows[0];
        if (existing.role !== 'department_officer'
          || Number(existing.department_id) !== Number(account.departmentId)
          || !Boolean(existing.is_active)) {
          throw new Error('Configured Water Resources demo officer email already belongs to an incompatible account; no account was changed.');
        }
      }
      console.log(`Existing ${account.kind} demo account left unchanged.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(account.password, 12);
    await connection.execute(
      `INSERT INTO users (name, email, mobile, password_hash, role, department_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [
        account.kind === 'cmo'
          ? 'Assessment CMO Administrator'
          : account.kind === 'water_officer' ? 'Assessment Water Resources Officer' : 'Assessment Department Officer',
        account.email,
        '0000000000',
        passwordHash,
        account.role,
        account.departmentId,
      ],
    );
    console.log(`Created ${account.kind} demo account with a hashed password.`);
  }
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
