import { getAuthorizedAttachment, getCitizenGrievance, getCitizenHistory, getCitizenStatistics, getMeta, getPublicTracking, createGrievance, listCitizenGrievances, submitCitizenFeedback } from '../services/grievanceService.js';
import { parsePositiveId, validateFeedback, validateFilters, validatePagination, validateReference, validateSubmission } from '../validators/grievanceValidators.js';
import { verifyFileSignature } from '../middleware/grievanceUpload.js';
import { httpError } from '../utils/httpError.js';

const send = (res, data, message = undefined, status = 200) => res.status(status).json({ success: true, ...(message ? { message } : {}), data });

export async function grievanceMeta(req, res) {
  send(res, await getMeta());
}

export async function submitGrievance(req, res) {
  const input = validateSubmission(req.body);
  const files = req.files || [];
  files.forEach(verifyFileSignature);
  const data = await createGrievance(input, req.user.id, files);
  send(res, data, 'Grievance submitted successfully.', 201);
}

export async function myGrievances(req, res) {
  const pagination = validatePagination(req.query);
  const filters = validateFilters(req.query);
  send(res, await listCitizenGrievances(req.user.id, pagination, filters));
}

export async function myStatistics(req, res) {
  send(res, await getCitizenStatistics(req.user.id));
}

export async function grievanceDetails(req, res) {
  send(res, await getCitizenGrievance(parsePositiveId(req.params.id), req.user.id));
}

export async function grievanceHistory(req, res) {
  send(res, await getCitizenHistory(parsePositiveId(req.params.id), req.user.id));
}

export async function trackGrievance(req, res) {
  send(res, await getPublicTracking(validateReference(req.params.reference)));
}

export async function leaveFeedback(req, res) {
  const data = await submitCitizenFeedback(parsePositiveId(req.params.id), req.user.id, validateFeedback(req.body));
  send(res, data, 'Thank you for your feedback.', 201);
}

export async function downloadAttachment(req, res, next) {
  const attachment = await getAuthorizedAttachment(parsePositiveId(req.params.attachmentId), req.user);
  res.set('X-Content-Type-Options', 'nosniff');
  res.download(attachment.absolutePath, attachment.original_filename, { headers: { 'Content-Type': attachment.mime_type } }, (error) => {
    if (!error || res.headersSent) return;
    if (error.code === 'ENOENT') return next(httpError(404, 'Attachment file is unavailable.'));
    next(error);
  });
}
