import { pool } from '../config/database.js';
import { httpError } from '../utils/httpError.js';
import { analyzeComplaint } from '../services/aiAnalysisService.js';
import { parsePositiveId } from '../validators/grievanceValidators.js';
import { validateAiDescription } from '../validators/aiValidators.js';

const send = (res, data) => res.json({ success: true, data: { ...data, aiGenerated: true } });

export async function analyzeCitizenDraft(req, res) {
  send(res, await analyzeComplaint(validateAiDescription(req.body)));
}

export async function analyzeCmoGrievance(req, res) {
  if (Object.keys(req.body || {}).length) throw httpError(400, 'This analysis uses the grievance already on file.');
  const grievanceId = parsePositiveId(req.params.id);
  const [rows] = await pool.execute('SELECT description FROM grievances WHERE id = ? LIMIT 1', [grievanceId]);
  if (!rows.length) throw httpError(404, 'Grievance not found.');
  send(res, await analyzeComplaint(validateAiDescription({ description: rows[0].description })));
}
