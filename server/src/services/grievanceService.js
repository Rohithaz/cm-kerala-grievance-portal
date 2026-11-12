import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { grievanceCategories } from '../config/grievance.js';
import { httpError } from '../utils/httpError.js';

const publicHistory = `SELECT h.id, h.previous_status, h.new_status, h.remarks, h.created_at,
                              u.name AS changed_by_name
                       FROM grievance_history h JOIN users u ON u.id = h.changed_by
                       WHERE h.grievance_id = ? AND h.citizen_visible = TRUE
                       ORDER BY h.created_at ASC, h.id ASC`;

const safeOriginalName = (name) => name.replace(/[\\/\x00-\x1f\x7f]/g, '_').slice(-255) || 'attachment';

export async function getMeta() {
  const [districts] = await pool.execute('SELECT id, name FROM districts ORDER BY id');
  return { districts, categories: grievanceCategories };
}

async function persistFiles(files) {
  await mkdir(env.uploadDir, { recursive: true });
  const persisted = [];
  try {
    for (const file of files) {
      const extension = path.extname(file.originalname).toLowerCase();
      const storedFilename = `${randomUUID()}${extension}`;
      const absolutePath = path.join(env.uploadDir, storedFilename);
      await writeFile(absolutePath, file.buffer, { flag: 'wx', mode: 0o600 });
      persisted.push({
        originalFilename: safeOriginalName(file.originalname), storedFilename,
        mimeType: file.mimetype, fileSize: file.size, absolutePath,
      });
    }
    return persisted;
  } catch (error) {
    await Promise.allSettled(persisted.map((file) => unlink(file.absolutePath)));
    throw error;
  }
}

async function removeFiles(files) {
  await Promise.allSettled(files.map((file) => unlink(file.absolutePath)));
}

export async function createGrievance(input, citizenId, files) {
  const [districtRows] = await pool.execute('SELECT id, name FROM districts WHERE name = ? LIMIT 1', [input.district]);
  if (!districtRows.length) throw httpError(400, 'Choose a district from the available list.');
  input.district = districtRows[0].name;
  const persisted = await persistFiles(files);
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const reference = `CMK-${new Date().getFullYear()}-${randomBytes(8).toString('hex').toUpperCase()}`;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [result] = await connection.execute(
          `INSERT INTO grievances
             (reference_number, citizen_id, district, category, subject, description, priority, status)
           VALUES (?, ?, ?, ?, ?, ?, 'Medium', 'Submitted')`,
          [reference, citizenId, input.district, input.category, input.subject, input.description],
        );
        await connection.execute(
          `INSERT INTO grievance_history
             (grievance_id, previous_status, new_status, remarks, citizen_visible, changed_by)
           VALUES (?, NULL, 'Submitted', ?, TRUE, ?)`,
          [result.insertId, 'Grievance received and submitted for review.', citizenId],
        );
        for (const file of persisted) {
          await connection.execute(
            `INSERT INTO attachments
               (grievance_id, uploaded_by, original_filename, stored_filename, mime_type, file_size, file_path)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [result.insertId, citizenId, file.originalFilename, file.storedFilename, file.mimeType, file.fileSize, file.storedFilename],
          );
        }
        const [[created]] = await connection.execute(
          'SELECT created_at FROM grievances WHERE id = ?',
          [result.insertId],
        );
        await connection.commit();
        const createdAt = created.created_at instanceof Date ? created.created_at.toISOString() : new Date(created.created_at).toISOString();
        return { id: String(result.insertId), reference_number: reference, status: 'Submitted', created_at: createdAt };
      } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY' && attempt < 2) continue;
        throw error;
      } finally {
        connection.release();
      }
    }
    throw httpError(503, 'Could not create a unique reference number. Please try again.');
  } catch (error) {
    await removeFiles(persisted);
    throw error;
  }
}

export async function listCitizenGrievances(citizenId, { page, limit }, filters) {
  const where = ['g.citizen_id = ?'];
  const values = [citizenId];
  for (const [column, value] of [['g.status', filters.status], ['g.district', filters.district], ['g.category', filters.category]]) {
    if (value) { where.push(`${column} = ?`); values.push(value); }
  }
  const clause = where.join(' AND ');
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM grievances g WHERE ${clause}`, values);
  const offset = (page - 1) * limit;
  const [items] = await pool.execute(
    `SELECT g.id, g.reference_number, g.subject, g.district, g.category, g.priority, g.status,
            d.name AS assigned_department, g.created_at, g.updated_at
     FROM grievances g LEFT JOIN departments d ON d.id = g.assigned_department_id
     WHERE ${clause} ORDER BY g.created_at DESC, g.id DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const total = Number(countRows[0].total);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCitizenStatistics(citizenId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 'Submitted'), 0) AS submitted,
            COALESCE(SUM(status = 'Under Review'), 0) AS under_review,
            COALESCE(SUM(status = 'In Progress'), 0) AS in_progress,
            COALESCE(SUM(status = 'Resolved'), 0) AS resolved,
            COALESCE(SUM(status = 'Reopened'), 0) AS reopened
     FROM grievances WHERE citizen_id = ?`,
    [citizenId],
  );
  return Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]));
}

export async function getCitizenGrievance(grievanceId, citizenId) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.reference_number, g.district, g.category, g.subject, g.description,
            g.priority, g.status, g.resolved_at, g.created_at, g.updated_at,
            d.id AS assigned_department_id, d.name AS assigned_department,
            (SELECT r.resolution_details FROM action_taken_reports r WHERE r.grievance_id=g.id AND r.report_status='approved' ORDER BY r.reviewed_at DESC,r.id DESC LIMIT 1) AS resolution_details
     FROM grievances g LEFT JOIN departments d ON d.id = g.assigned_department_id
     WHERE g.id = ? AND g.citizen_id = ? LIMIT 1`,
    [grievanceId, citizenId],
  );
  const grievance = rows[0];
  if (!grievance) throw httpError(404, 'Grievance not found.');
  const [history] = await pool.execute(publicHistory, [grievanceId]);
  const [remarks] = await pool.execute(
    `SELECT r.id, r.remark, r.created_at, u.name AS created_by_name
     FROM grievance_remarks r JOIN users u ON u.id = r.created_by
     WHERE r.grievance_id = ? AND r.visibility = 'citizen' ORDER BY r.created_at ASC, r.id ASC`, [grievanceId],
  );
  const [attachments] = await pool.execute(
    `SELECT id, original_filename, mime_type, file_size, created_at
     FROM attachments WHERE grievance_id = ? ORDER BY id`, [grievanceId],
  );
  const [feedbackRows] = await pool.execute(
    'SELECT rating, comments, created_at FROM citizen_feedback WHERE grievance_id = ? AND citizen_id = ? LIMIT 1',
    [grievanceId, citizenId],
  );
  return { ...grievance, id: String(grievance.id), assigned_department_id: grievance.assigned_department_id == null ? null : Number(grievance.assigned_department_id), history, remarks, attachments, feedback: feedbackRows[0] || null };
}

export async function getPublicTracking(reference) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.reference_number, g.subject, g.district, g.category, g.priority, g.status,
            g.created_at, g.updated_at, g.resolved_at, d.name AS assigned_department
     FROM grievances g LEFT JOIN departments d ON d.id = g.assigned_department_id
     WHERE g.reference_number = ? LIMIT 1`, [reference],
  );
  if (!rows.length) throw httpError(404, 'Grievance not found.');
  const [history] = await pool.execute(publicHistory, [rows[0].id]);
  return { ...rows[0], id: String(rows[0].id), history };
}

export async function getCitizenHistory(grievanceId, citizenId) {
  const [owned] = await pool.execute('SELECT id FROM grievances WHERE id = ? AND citizen_id = ? LIMIT 1', [grievanceId, citizenId]);
  if (!owned.length) throw httpError(404, 'Grievance not found.');
  const [history] = await pool.execute(publicHistory, [grievanceId]);
  return history;
}

export async function submitCitizenFeedback(grievanceId, citizenId, input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT status FROM grievances WHERE id = ? AND citizen_id = ? LIMIT 1 FOR UPDATE', [grievanceId, citizenId],
    );
    if (!rows.length) throw httpError(404, 'Grievance not found.');
    if (rows[0].status !== 'Resolved') throw httpError(409, 'Feedback can be submitted after the grievance is resolved.');
    await connection.execute(
      'INSERT INTO citizen_feedback (grievance_id, citizen_id, rating, comments) VALUES (?, ?, ?, ?)',
      [grievanceId, citizenId, input.rating, input.comments],
    );
    await connection.commit();
    return { grievance_id: grievanceId, rating: input.rating, comments: input.comments, created_at: new Date().toISOString() };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') throw httpError(409, 'Feedback has already been submitted for this grievance.');
    throw error;
  } finally { connection.release(); }
}

export async function getAuthorizedAttachment(attachmentId, user) {
  const [rows] = await pool.execute(
    `SELECT a.id, a.original_filename, a.stored_filename, a.mime_type, a.file_size,
            g.citizen_id, g.assigned_department_id, g.assigned_officer_id
     FROM attachments a JOIN grievances g ON g.id = a.grievance_id WHERE a.id = ? LIMIT 1`,
    [attachmentId],
  );
  const attachment = rows[0];
  if (!attachment) throw httpError(404, 'Attachment not found.');
  const permitted = user.role === 'cmo_admin'
    || (user.role === 'citizen' && String(attachment.citizen_id) === user.id)
    || (user.role === 'department_officer' && String(attachment.assigned_officer_id) === user.id);
  if (!permitted) throw httpError(403, 'You do not have permission to access this attachment.');
  if (!/^[\da-f-]{36}\.(pdf|jpe?g|png)$/i.test(attachment.stored_filename)) throw httpError(404, 'Attachment not found.');
  return { ...attachment, absolutePath: path.join(env.uploadDir, attachment.stored_filename) };
}
