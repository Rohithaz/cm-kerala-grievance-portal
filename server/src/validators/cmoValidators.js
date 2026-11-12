import { httpError } from '../utils/httpError.js';

const statuses = new Set(['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Reopened']);
const priorities = new Set(['Low', 'Medium', 'High']);
const value = (input) => typeof input === 'string' ? input.trim() : '';

export function cmoId(input) {
  const id = String(input ?? '');
  if (!/^\d{1,18}$/.test(id) || BigInt(id) < 1n) throw httpError(404, 'Record not found.');
  return id;
}

export function cmoPagination(query) {
  const page = Number(query.page ?? 1); const limit = Number(query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) throw httpError(400, 'Page and limit must be positive integers.');
  return { page: Math.min(page, 100000), limit: Math.min(limit, 50) };
}

export function cmoFilters(query) {
  const district = value(query.district); const category = value(query.category); const priority = value(query.priority);
  const status = value(query.status); const departmentId = query.departmentId ? cmoId(query.departmentId) : '';
  const overdue = value(query.overdue); const search = value(query.search);
  if (district.length > 80 || category.length > 100 || search.length > 120) throw httpError(400, 'A filter value is too long.');
  if (priority && !priorities.has(priority)) throw httpError(400, 'Choose a valid priority.');
  if (status && !statuses.has(status)) throw httpError(400, 'Choose a valid status.');
  if (overdue && !['true', 'false'].includes(overdue)) throw httpError(400, 'The overdue filter must be true or false.');
  if (query.sort && !['created_at', 'updated_at'].includes(query.sort)) throw httpError(400, 'Choose a valid sort field.');
  const direction = value(query.direction || 'desc').toUpperCase();
  if (!['ASC', 'DESC'].includes(direction)) throw httpError(400, 'Sort direction must be asc or desc.');
  return { district, category, priority, status, departmentId, overdue, search, sort: query.sort || 'created_at', direction };
}

export function remarkInput(body) {
  const remark = value(body?.remark); const visibility = value(body?.visibility || 'internal');
  if (Object.keys(body || {}).some((key) => !['remark', 'visibility'].includes(key))) throw httpError(400, 'Only remark and visibility may be provided.');
  if (remark.length < 3 || remark.length > 4000) throw httpError(400, 'Remark must be between 3 and 4000 characters.');
  if (!['internal', 'citizen'].includes(visibility)) throw httpError(400, 'Visibility must be internal or citizen.');
  return { remark, visibility };
}

export function escalationInput(body) {
  const reason = value(body?.reason);
  if (Object.keys(body || {}).some((key) => key !== 'reason')) throw httpError(400, 'Only an escalation reason may be provided.');
  if (reason.length < 5 || reason.length > 2000) throw httpError(400, 'Escalation reason must be between 5 and 2000 characters.');
  return { reason };
}

export function assignmentInput(body) {
  if (Object.keys(body || {}).some((key) => !['departmentId', 'officerId', 'notes'].includes(key))) throw httpError(400, 'Only departmentId, officerId, and notes may be provided.');
  const departmentId = cmoId(body?.departmentId); const officerId = cmoId(body?.officerId);
  const notes = value(body?.notes);
  if (notes.length > 2000) throw httpError(400, 'Assignment notes may not exceed 2000 characters.');
  return { departmentId, officerId, notes: notes || null };
}
