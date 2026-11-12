import { Router } from 'express';
import { authenticateToken, authorizeRoles, requireActiveUser } from '../middleware/authMiddleware.js';
import { actionReport, actionReports, assign, departmentStatistics, departments, districtStatistics, escalate, grievance, grievances, officers, reopen, remark, review, reviewAction, statistics, reportAttachmentDownload } from '../controllers/cmoController.js';
import rateLimit from 'express-rate-limit';
import { analyzeCmoGrievance } from '../controllers/aiController.js';

const router = Router();
const aiAnalysisLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'AI analysis is temporarily rate limited. Please try again later.' } });
router.use(authenticateToken, requireActiveUser, authorizeRoles('cmo_admin'));

router.get('/departments', departments);
router.get('/departments/:departmentId/officers', officers);
router.get('/statistics', statistics);
router.get('/statistics/districts', districtStatistics);
router.get('/statistics/departments', departmentStatistics);
router.get('/action-reports',actionReports);
router.get('/action-reports/attachments/:attachmentId/download',reportAttachmentDownload);
router.get('/action-reports/:id',actionReport);
router.post('/action-reports/:id/review',reviewAction);
router.get('/grievances', grievances);
router.get('/grievances/:id', grievance);
router.post('/grievances/:id/ai-analysis', aiAnalysisLimit, analyzeCmoGrievance);
router.post('/grievances/:id/review', review);
router.post('/grievances/:id/assign', assign);
router.post('/grievances/:id/remarks', remark);
router.post('/grievances/:id/escalate', escalate);
router.post('/grievances/:id/reopen',reopen);

export default router;
