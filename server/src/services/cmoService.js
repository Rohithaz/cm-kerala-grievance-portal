import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { httpError } from '../utils/httpError.js';
import path from 'node:path';

const listSelect = `SELECT g.id, g.reference_number, g.subject, g.district, g.category, g.priority, g.status,
                           g.created_at, g.updated_at, g.due_at, c.name AS citizen_name,
                           d.id AS assigned_department_id, d.name AS assigned_department,
                           o.id AS assigned_officer_id, o.name AS assigned_officer,
                           (g.due_at < CURRENT_TIMESTAMP AND g.status <> 'Resolved') AS is_overdue,
                           EXISTS(SELECT 1 FROM grievance_escalations e WHERE e.grievance_id = g.id) AS is_escalated
                    FROM grievances g JOIN users c ON c.id = g.citizen_id
                    LEFT JOIN departments d ON d.id = g.assigned_department_id
                    LEFT JOIN users o ON o.id = g.assigned_officer_id`;

export async function getCmoDepartments() {
  const [rows] = await pool.execute('SELECT id, name, description FROM departments ORDER BY name');
  return rows;
}

export async function getDepartmentOfficers(departmentId) {
  const [departments] = await pool.execute('SELECT id FROM departments WHERE id = ? LIMIT 1', [departmentId]);
  if (!departments.length) throw httpError(404, 'Department not found.');
  const [rows] = await pool.execute(
    `SELECT id, name, email, mobile FROM users
     WHERE department_id = ? AND role = 'department_officer' AND is_active = TRUE
     ORDER BY name`, [departmentId],
  );
  return rows.map((row) => ({ ...row, id: String(row.id) }));
}

export async function getCmoStatistics() {
  const [totals] = await pool.execute(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status <> 'Resolved'), 0) AS pending,
            COALESCE(SUM(status = 'Resolved'), 0) AS resolved,
            COALESCE(SUM(due_at < CURRENT_TIMESTAMP AND status <> 'Resolved'), 0) AS overdue,
            COALESCE(SUM(status = 'Submitted'), 0) AS submitted,
            COALESCE(SUM(status = 'Under Review'), 0) AS under_review,
            COALESCE(SUM(status = 'In Progress'), 0) AS in_progress,
            COALESCE(SUM(status = 'Reopened'), 0) AS reopened,
            COALESCE(SUM(priority = 'High'), 0) AS \`high_priority\`
     FROM grievances`,
  );
  const [recent] = await pool.execute(`${listSelect} ORDER BY g.created_at DESC, g.id DESC LIMIT 8`);
  const [highPriority] = await pool.execute(`${listSelect} WHERE g.priority = 'High' AND g.status <> 'Resolved' ORDER BY g.created_at DESC LIMIT 8`);
  const [overdue] = await pool.execute(`${listSelect} WHERE g.due_at < CURRENT_TIMESTAMP AND g.status <> 'Resolved' ORDER BY g.due_at ASC LIMIT 8`);
  const [escalated] = await pool.execute(
    `${listSelect} WHERE EXISTS(SELECT 1 FROM grievance_escalations e WHERE e.grievance_id = g.id)
     ORDER BY (SELECT MAX(e.created_at) FROM grievance_escalations e WHERE e.grievance_id = g.id) DESC LIMIT 8`,
  );
  const [activity] = await pool.execute(
    `SELECT * FROM (
       SELECT 'status' AS activity_type, g.id AS grievance_id, g.reference_number,
              CONCAT('Status changed to ', h.new_status) AS summary, u.name AS actor, h.created_at
       FROM grievance_history h JOIN grievances g ON g.id = h.grievance_id JOIN users u ON u.id = h.changed_by
       WHERE u.role = 'cmo_admin'
       UNION ALL
       SELECT 'assignment', g.id, g.reference_number, CONCAT('Assigned to ', d.name), u.name, a.assigned_at
       FROM department_assignments a JOIN grievances g ON g.id = a.grievance_id
       JOIN departments d ON d.id = a.department_id JOIN users u ON u.id = a.assigned_by
       UNION ALL
       SELECT 'remark', g.id, g.reference_number, LEFT(r.remark, 160), u.name, r.created_at
       FROM grievance_remarks r JOIN grievances g ON g.id = r.grievance_id JOIN users u ON u.id = r.created_by
       UNION ALL
       SELECT 'escalation', g.id, g.reference_number, LEFT(e.reason, 160), u.name, e.created_at
       FROM grievance_escalations e JOIN grievances g ON g.id = e.grievance_id JOIN users u ON u.id = e.escalated_by
     ) activity ORDER BY created_at DESC LIMIT 10`,
  );
  const [[reportCounts]] = await pool.execute("SELECT COUNT(*) total,COALESCE(SUM(report_status='submitted'),0) pending FROM action_taken_reports");
  const [recentReports] = await pool.execute(`SELECT r.id,r.report_title,r.report_status,r.submitted_at,g.id grievance_id,g.reference_number,d.name department,u.name officer FROM action_taken_reports r JOIN grievances g ON g.id=r.grievance_id JOIN departments d ON d.id=g.assigned_department_id JOIN users u ON u.id=r.submitted_by WHERE r.report_status='submitted' ORDER BY r.submitted_at DESC LIMIT 6`);
  return {
    statistics: Object.fromEntries(Object.entries(totals[0]).map(([key, value]) => [key, Number(value)])),
    recent: recent.map(normalizeGrievance), highPriority: highPriority.map(normalizeGrievance),
    overdue: overdue.map(normalizeGrievance), escalated: escalated.map(normalizeGrievance), activity,
    actionReports: { total: Number(reportCounts.total), pending: Number(reportCounts.pending), recent: recentReports.map(r=>({...r,id:String(r.id),grievance_id:String(r.grievance_id)})) },
  };
}

export async function getDistrictStatistics() {
  const [rows] = await pool.execute(
    `SELECT d.name AS district, COUNT(g.id) AS total,
            COALESCE(SUM(g.status <> 'Resolved'), 0) AS pending,
            COALESCE(SUM(g.status = 'Resolved'), 0) AS resolved,
            COALESCE(SUM(g.due_at < CURRENT_TIMESTAMP AND g.status <> 'Resolved'), 0) AS overdue
     FROM districts d LEFT JOIN grievances g ON g.district = d.name
     GROUP BY d.id, d.name ORDER BY total DESC, d.id`,
  );
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, key === 'district' ? value : Number(value)])));
}

export async function getDepartmentStatistics() {
  const [rows] = await pool.execute(
    `SELECT d.id, d.name AS department, COUNT(g.id) AS assigned,
            COALESCE(SUM(g.status = 'In Progress'), 0) AS in_progress,
            COALESCE(SUM(g.status = 'Resolved'), 0) AS resolved,
            COALESCE(SUM(g.due_at < CURRENT_TIMESTAMP AND g.status <> 'Resolved'), 0) AS overdue
     FROM departments d LEFT JOIN grievances g ON g.assigned_department_id = d.id
     GROUP BY d.id, d.name ORDER BY assigned DESC, d.name`,
  );
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, key === 'department' ? value : Number(value)])));
}

function normalizeGrievance(row) {
  return { ...row, id: String(row.id), is_overdue: Boolean(row.is_overdue), is_escalated: Boolean(row.is_escalated) };
}

export async function listCmoGrievances({ page, limit }, filters) {
  const where = []; const values = [];
  if (filters.district) { where.push('g.district = ?'); values.push(filters.district); }
  if (filters.category) { where.push('g.category = ?'); values.push(filters.category); }
  if (filters.priority) { where.push('g.priority = ?'); values.push(filters.priority); }
  if (filters.status) { where.push('g.status = ?'); values.push(filters.status); }
  if (filters.departmentId) { where.push('g.assigned_department_id = ?'); values.push(filters.departmentId); }
  if (filters.overdue === 'true') where.push("g.due_at < CURRENT_TIMESTAMP AND g.status <> 'Resolved'");
  if (filters.overdue === 'false') where.push("(g.due_at IS NULL OR g.due_at >= CURRENT_TIMESTAMP OR g.status = 'Resolved')");
  if (filters.search) { where.push('(g.reference_number LIKE ? OR g.subject LIKE ?)'); values.push(`%${filters.search}%`, `%${filters.search}%`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM grievances g ${clause}`, values);
  const column = filters.sort === 'updated_at' ? 'g.updated_at' : 'g.created_at';
  const [rows] = await pool.execute(
    `${listSelect} ${clause} ORDER BY ${column} ${filters.direction}, g.id ${filters.direction} LIMIT ? OFFSET ?`,
    [...values, limit, (page - 1) * limit],
  );
  const total = Number(countRows[0].total);
  return { items: rows.map(normalizeGrievance), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCmoGrievance(grievanceId) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.reference_number, g.citizen_id, c.name AS citizen_name, c.email AS citizen_email, c.mobile AS citizen_mobile,
            g.district, g.category, g.subject, g.description, g.priority, g.status, g.due_at, g.resolved_at,
            g.created_at, g.updated_at, g.assigned_department_id, d.name AS assigned_department,
            g.assigned_officer_id, o.name AS assigned_officer, o.email AS assigned_officer_email,
            (g.due_at < CURRENT_TIMESTAMP AND g.status <> 'Resolved') AS is_overdue
     FROM grievances g JOIN users c ON c.id = g.citizen_id
     LEFT JOIN departments d ON d.id = g.assigned_department_id
     LEFT JOIN users o ON o.id = g.assigned_officer_id
     WHERE g.id = ? LIMIT 1`, [grievanceId],
  );
  if (!rows.length) throw httpError(404, 'Grievance not found.');
  const [assignments] = await pool.execute(
    `SELECT a.id, a.department_id, d.name AS department, a.officer_id, o.name AS officer,
            a.assigned_by, u.name AS assigned_by_name, a.assignment_notes, a.assigned_at
     FROM department_assignments a JOIN departments d ON d.id = a.department_id
     LEFT JOIN users o ON o.id = a.officer_id JOIN users u ON u.id = a.assigned_by
     WHERE a.grievance_id = ? ORDER BY a.assigned_at ASC, a.id ASC`, [grievanceId],
  );
  const [history] = await pool.execute(
    `SELECT h.id, h.previous_status, h.new_status, h.remarks, h.citizen_visible, h.created_at,
            u.id AS changed_by, u.name AS changed_by_name, u.role AS changed_by_role
     FROM grievance_history h JOIN users u ON u.id = h.changed_by
     WHERE h.grievance_id = ? ORDER BY h.created_at ASC, h.id ASC`, [grievanceId],
  );
  const [remarks] = await pool.execute(
    `SELECT r.id, r.remark, r.visibility, r.created_at, u.id AS created_by, u.name AS created_by_name
     FROM grievance_remarks r JOIN users u ON u.id = r.created_by
     WHERE r.grievance_id = ? ORDER BY r.created_at ASC, r.id ASC`, [grievanceId],
  );
  const [escalations] = await pool.execute(
    `SELECT e.id, e.reason, e.created_at, u.id AS escalated_by, u.name AS escalated_by_name
     FROM grievance_escalations e JOIN users u ON u.id = e.escalated_by
     WHERE e.grievance_id = ? ORDER BY e.created_at ASC, e.id ASC`, [grievanceId],
  );
  const [attachments] = await pool.execute(
    `SELECT id, original_filename, mime_type, file_size, created_at FROM attachments WHERE grievance_id = ? ORDER BY id`, [grievanceId],
  );
  const g = rows[0];
  return { ...g, id: String(g.id), citizen_id: String(g.citizen_id), assigned_department_id: g.assigned_department_id == null ? null : Number(g.assigned_department_id), assigned_officer_id: g.assigned_officer_id == null ? null : String(g.assigned_officer_id), is_overdue: Boolean(g.is_overdue), assignments, history, remarks, escalations, attachments };
}

export async function reviewGrievance(grievanceId, adminId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT status FROM grievances WHERE id = ? LIMIT 1 FOR UPDATE', [grievanceId]);
    if (!rows.length) throw httpError(404, 'Grievance not found.');
    if (rows[0].status !== 'Submitted') throw httpError(409, 'Only Submitted grievances may be moved to Under Review.');
    await connection.execute("UPDATE grievances SET status = 'Under Review' WHERE id = ?", [grievanceId]);
    await connection.execute(
      `INSERT INTO grievance_history (grievance_id,previous_status,new_status,remarks,citizen_visible,changed_by)
       VALUES (?, 'Submitted','Under Review',?,TRUE,?)`,
      [grievanceId, 'Your grievance has been reviewed by the CMO and is under review.', adminId],
    );
    await connection.commit();
    return { id: grievanceId, previous_status: 'Submitted', status: 'Under Review' };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function assignGrievance(grievanceId, adminId, input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [grievances] = await connection.execute('SELECT status FROM grievances WHERE id = ? LIMIT 1 FOR UPDATE', [grievanceId]);
    if (!grievances.length) throw httpError(404, 'Grievance not found.');
    const previousStatus = grievances[0].status;
    if (!['Under Review', 'In Progress', 'Reopened'].includes(previousStatus)) throw httpError(409, 'Review or reopen the grievance before assigning it to a department.');
    const [departments] = await connection.execute('SELECT id,name FROM departments WHERE id = ? LIMIT 1', [input.departmentId]);
    if (!departments.length) throw httpError(404, 'Department not found.');
    const [officers] = await connection.execute(
      `SELECT id,name FROM users WHERE id = ? AND role = 'department_officer' AND department_id = ? AND is_active = TRUE LIMIT 1 FOR UPDATE`,
      [input.officerId, input.departmentId],
    );
    if (!officers.length) throw httpError(400, 'Choose an active officer who belongs to the selected department.');
    await connection.execute(
      `INSERT INTO department_assignments (grievance_id,department_id,officer_id,assigned_by,assignment_notes)
       VALUES (?,?,?,?,?)`, [grievanceId,input.departmentId,input.officerId,adminId,input.notes],
    );
    const nextStatus = previousStatus === 'Under Review' || previousStatus === 'Reopened' ? 'In Progress' : previousStatus;
    await connection.execute(
      'UPDATE grievances SET assigned_department_id = ?, assigned_officer_id = ?, status = ? WHERE id = ?',
      [input.departmentId,input.officerId,nextStatus,grievanceId],
    );
    const publicRemark = previousStatus === 'Under Review'
      ? `Your grievance has been forwarded to ${departments[0].name}.`
      : `Your grievance assignment has been updated to ${departments[0].name}.`;
    await connection.execute(
      `INSERT INTO grievance_history (grievance_id,previous_status,new_status,remarks,citizen_visible,changed_by)
       VALUES (?,?,?,?,TRUE,?)`, [grievanceId,previousStatus,nextStatus,publicRemark,adminId],
    );
    await connection.commit();
    return { id: grievanceId, department: departments[0].name, officer: officers[0].name, previous_status: previousStatus, status: nextStatus };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function addCmoRemark(grievanceId, adminId, input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id FROM grievances WHERE id = ? LIMIT 1 FOR UPDATE', [grievanceId]);
    if (!rows.length) throw httpError(404, 'Grievance not found.');
    const [result] = await connection.execute(
      'INSERT INTO grievance_remarks (grievance_id,created_by,remark,visibility) VALUES (?,?,?,?)',
      [grievanceId,adminId,input.remark,input.visibility],
    );
    await connection.commit();
    return { id: String(result.insertId), grievance_id: grievanceId, remark: input.remark, visibility: input.visibility };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function escalateGrievance(grievanceId, adminId, input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT status FROM grievances WHERE id = ? LIMIT 1 FOR UPDATE', [grievanceId]);
    if (!rows.length) throw httpError(404, 'Grievance not found.');
    if (rows[0].status === 'Resolved') throw httpError(409, 'Resolved grievances cannot be escalated.');
    const [result] = await connection.execute(
      'INSERT INTO grievance_escalations (grievance_id,escalated_by,reason) VALUES (?,?,?)',
      [grievanceId,adminId,input.reason],
    );
    await connection.commit();
    return { id: String(result.insertId), grievance_id: grievanceId, reason: input.reason };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function listCmoActionReports({page,limit,status}) {
  const where = status ? 'WHERE r.report_status=?' : 'WHERE r.report_status IN (\'submitted\',\'approved\',\'changes_requested\')';
  const values = status ? [status] : [];
  const [count] = await pool.execute(`SELECT COUNT(*) total FROM action_taken_reports r ${where}`, values);
  const [rows] = await pool.execute(`SELECT r.id,r.grievance_id,r.report_title,r.report_status,r.submitted_at,r.reviewed_at,g.reference_number,g.subject,d.name department,u.name officer FROM action_taken_reports r JOIN grievances g ON g.id=r.grievance_id JOIN departments d ON d.id=g.assigned_department_id JOIN users u ON u.id=r.submitted_by ${where} ORDER BY r.submitted_at DESC,r.id DESC LIMIT ? OFFSET ?`, [...values,limit,(page-1)*limit]);
  return {items:rows.map(r=>({...r,id:String(r.id),grievance_id:String(r.grievance_id)})),pagination:{page,limit,total:Number(count[0].total),totalPages:Math.ceil(Number(count[0].total)/limit)}};
}

export async function getCmoActionReport(reportId) {
  const [rows] = await pool.execute(`SELECT r.*,g.reference_number,g.subject,g.district,g.category,g.status grievance_status,d.name department,u.name officer,u.email officer_email FROM action_taken_reports r JOIN grievances g ON g.id=r.grievance_id JOIN departments d ON d.id=g.assigned_department_id JOIN users u ON u.id=r.submitted_by WHERE r.id=? LIMIT 1`,[reportId]);
  if(!rows.length) throw httpError(404,'Action report not found.');
  const [reviews]=await pool.execute('SELECT v.id,v.decision,v.remarks,v.created_at,u.name reviewer FROM action_taken_report_reviews v JOIN users u ON u.id=v.reviewed_by WHERE v.report_id=? ORDER BY v.created_at,v.id',[reportId]);
  const [attachments]=await pool.execute('SELECT id,original_filename,mime_type,file_size,created_at FROM action_taken_report_attachments WHERE report_id=? ORDER BY id',[reportId]);
  return {...rows[0],id:String(rows[0].id),grievance_id:String(rows[0].grievance_id),submitted_by:String(rows[0].submitted_by),reviews,attachments};
}

export async function reviewActionReport(reportId, adminId, {decision,remarks}) {
  const c=await pool.getConnection();
  try { await c.beginTransaction();
    const [rows]=await c.execute('SELECT * FROM action_taken_reports WHERE id=? LIMIT 1 FOR UPDATE',[reportId]);
    if(!rows.length) throw httpError(404,'Action report not found.');
    const report=rows[0]; if(report.report_status!=='submitted') throw httpError(409,'Only submitted action reports can be reviewed.');
    if(decision==='approve'&&!report.resolution_details?.trim()) throw httpError(409,'Resolution details are required before a report can be approved.');
    const [grievances]=await c.execute('SELECT status FROM grievances WHERE id=? LIMIT 1 FOR UPDATE',[report.grievance_id]);
    if(!grievances.length||!['In Progress','Reopened'].includes(grievances[0].status)) throw httpError(409,'The grievance is not eligible for action report review.');
    const next=decision==='approve'?'approved':'changes_requested';
    await c.execute('UPDATE action_taken_reports SET report_status=?,reviewed_by=?,review_remarks=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?',[next,adminId,remarks,reportId]);
    await c.execute('INSERT INTO action_taken_report_reviews(report_id,reviewed_by,decision,remarks) VALUES(?,?,?,?)',[reportId,adminId,next,remarks]);
    if(decision==='approve') {
      await c.execute("UPDATE grievances SET status='Resolved',resolved_at=CURRENT_TIMESTAMP WHERE id=?",[report.grievance_id]);
      const publicText=report.resolution_details ? `Resolution approved: ${report.resolution_details}` : `The CMO approved the department action report: ${remarks}`;
      await c.execute("INSERT INTO grievance_history(grievance_id,previous_status,new_status,remarks,citizen_visible,changed_by) VALUES(?,?,'Resolved',?,TRUE,?)",[report.grievance_id,grievances[0].status,publicText,adminId]);
      await c.execute("INSERT INTO grievance_remarks(grievance_id,created_by,remark,visibility) VALUES(?,?,?,'citizen')",[report.grievance_id,adminId,publicText]);
    } else {
      await c.execute("INSERT INTO grievance_remarks(grievance_id,created_by,remark,visibility) VALUES(?,?,?,'internal')",[report.grievance_id,adminId,`Additional action requested: ${remarks}`]);
      await c.execute("INSERT INTO grievance_remarks(grievance_id,created_by,remark,visibility) VALUES(?,?,?,'citizen')",[report.grievance_id,adminId,'The CMO reviewed the department response and additional action is underway.']);
    }
    await c.commit();return {id:String(reportId),report_status:next,grievance_status:decision==='approve'?'Resolved':grievances[0].status};
  } catch(e){await c.rollback();throw e;}finally{c.release();}
}

export async function reopenGrievance(grievanceId,adminId,reason){
  const c=await pool.getConnection();try{await c.beginTransaction();const [rows]=await c.execute('SELECT status FROM grievances WHERE id=? LIMIT 1 FOR UPDATE',[grievanceId]);if(!rows.length)throw httpError(404,'Grievance not found.');if(rows[0].status!=='Resolved')throw httpError(409,'Only resolved grievances may be reopened.');await c.execute("UPDATE grievances SET status='Reopened' WHERE id=?",[grievanceId]);await c.execute("INSERT INTO grievance_history(grievance_id,previous_status,new_status,remarks,citizen_visible,changed_by) VALUES(?,'Resolved','Reopened',?,TRUE,?)",[grievanceId,reason,adminId]);await c.execute("INSERT INTO grievance_remarks(grievance_id,created_by,remark,visibility) VALUES(?,?,?,'citizen')",[grievanceId,adminId,`The grievance was reopened: ${reason}`]);await c.commit();return{id:grievanceId,previous_status:'Resolved',status:'Reopened'};}catch(e){await c.rollback();throw e;}finally{c.release();}
}

export async function getReportAttachment(attachmentId,user){
 const [rows]=await pool.execute(`SELECT a.*,r.submitted_by,g.assigned_officer_id FROM action_taken_report_attachments a JOIN action_taken_reports r ON r.id=a.report_id JOIN grievances g ON g.id=r.grievance_id WHERE a.id=? LIMIT 1`,[attachmentId]);
 const a=rows[0];if(!a)throw httpError(404,'Attachment not found.');if(user.role!=='cmo_admin'&&!(user.role==='department_officer'&&String(a.assigned_officer_id)===user.id&&String(a.submitted_by)===user.id))throw httpError(403,'You do not have permission to access this attachment.');
 if(!/^[\da-f-]{36}\.(pdf|jpe?g|png)$/i.test(a.stored_filename))throw httpError(404,'Attachment not found.');return{...a,absolutePath:path.join(env.uploadDir,a.stored_filename)};
}
