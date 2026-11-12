import { grievanceCategories, grievanceStatuses } from '../config/grievance.js';
import { httpError } from '../utils/httpError.js';

const text = (value) => typeof value === 'string' ? value.trim() : '';

export function validateSubmission(body) {
  const allowedFields = new Set(['district', 'category', 'subject', 'description']);
  if (Object.keys(body || {}).some((key) => !allowedFields.has(key))) {
    throw httpError(400, 'Only district, category, subject, and description may be submitted.');
  }
  const district = text(body?.district);
  const category = text(body?.category);
  const subject = text(body?.subject);
  const description = text(body?.description);
  if (!district) throw httpError(400, 'Choose a district.');
  if (!grievanceCategories.includes(category)) throw httpError(400, 'Choose a valid grievance category.');
  if (subject.length < 5 || subject.length > 200) throw httpError(400, 'Subject must be between 5 and 200 characters.');
  if (description.length < 20 || description.length > 10000) throw httpError(400, 'Description must be between 20 and 10000 characters.');
  return { district, category, subject, description };
}

export function validatePagination(query) {
  const parsedPage = Number.parseInt(query.page || '1', 10);
  const parsedLimit = Number.parseInt(query.limit || '10', 10);
  if (!Number.isInteger(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedLimit) || parsedLimit < 1) {
    throw httpError(400, 'Page and limit must be positive integers.');
  }
  return { page: Math.min(parsedPage, 100000), limit: Math.min(parsedLimit, 50) };
}

export function validateFilters(query) {
  const status = text(query.status);
  const category = text(query.category);
  const district = text(query.district);
  if (status && !grievanceStatuses.includes(status)) throw httpError(400, 'Choose a valid status filter.');
  if (category && !grievanceCategories.includes(category)) throw httpError(400, 'Choose a valid category filter.');
  if (district.length > 80) throw httpError(400, 'District filter is too long.');
  return { status, category, district };
}

export function validateFeedback(body) {
  const rating = Number(body?.rating);
  const comments = body?.comments == null ? '' : text(body.comments);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw httpError(400, 'Rating must be an integer from 1 to 5.');
  if (comments.length > 2000) throw httpError(400, 'Feedback comments may not exceed 2000 characters.');
  return { rating, comments: comments || null };
}

export function parsePositiveId(value) {
  if (!/^\d{1,18}$/.test(String(value)) || BigInt(value) < 1n) throw httpError(404, 'Grievance not found.');
  return String(value);
}

export function validateReference(value) {
  const reference = String(value || '').trim().toUpperCase();
  if (!/^CMK-\d{4}-[A-F0-9]{16}$/.test(reference)) throw httpError(404, 'Grievance not found.');
  return reference;
}
