import { Router } from 'express';
import { authenticateToken, authorizeRoles, requireActiveUser } from '../middleware/authMiddleware.js';
import { parseGrievanceFiles } from '../middleware/grievanceUpload.js';
import rateLimit from 'express-rate-limit';
import { analyzeCitizenDraft } from '../controllers/aiController.js';
import { downloadAttachment, grievanceDetails, grievanceHistory, grievanceMeta, leaveFeedback, myGrievances, myStatistics, submitGrievance, trackGrievance } from '../controllers/grievanceController.js';

const router = Router();
const citizen = [authenticateToken, requireActiveUser, authorizeRoles('citizen')];
const aiAnalysisLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'AI analysis is temporarily rate limited. Please try again later.' } });

router.get('/meta', grievanceMeta);
router.post('/ai-analysis', ...citizen, aiAnalysisLimit, analyzeCitizenDraft);
router.get('/track/:reference', trackGrievance);
router.get('/attachments/:attachmentId/download', authenticateToken, requireActiveUser, authorizeRoles('citizen', 'cmo_admin', 'department_officer'), downloadAttachment);
router.get('/my/statistics', ...citizen, myStatistics);
router.get('/my', ...citizen, myGrievances);
router.post('/', ...citizen, parseGrievanceFiles, submitGrievance);
router.get('/:id/history', ...citizen, grievanceHistory);
router.post('/:id/feedback', ...citizen, leaveFeedback);
router.get('/:id', ...citizen, grievanceDetails);

export default router;
