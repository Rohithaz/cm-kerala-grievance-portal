import { httpError } from '../utils/httpError.js';

export function validateAiDescription(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw httpError(400, 'Provide a complaint description.');
  if (Object.keys(body).some((key) => key !== 'description')) throw httpError(400, 'Only the complaint description may be analyzed.');
  if (typeof body.description !== 'string') throw httpError(400, 'Provide a complaint description.');
  const description = body.description.trim();
  if (description.length < 20) throw httpError(400, 'The complaint description must contain at least 20 characters.');
  if (description.length > 10000) throw httpError(413, 'The complaint description may not exceed 10000 characters.');
  return description;
}
