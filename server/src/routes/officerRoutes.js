import { Router } from 'express';
import { authenticateToken, authorizeRoles, requireActiveUser } from '../middleware/authMiddleware.js';
import { parseGrievanceFiles } from '../middleware/grievanceUpload.js';
import { detail, downloadReportAttachment, editReport, grievances, history, newReport, remark, reportAttachment, reports, statistics, status, submitReport } from '../controllers/officerController.js';
const router=Router();router.use(authenticateToken,requireActiveUser,authorizeRoles('department_officer'));
router.get('/action-reports/attachments/:attachmentId/download',downloadReportAttachment);router.post('/action-reports/:reportId/attachments',parseGrievanceFiles,(req,res,next)=>{req.file=req.files?.[0];next();},reportAttachment);router.get('/statistics',statistics);router.get('/grievances',grievances);router.get('/grievances/:id/history',history);router.post('/grievances/:id/remarks',remark);router.post('/grievances/:id/status',status);router.get('/grievances/:id/action-reports',reports);router.post('/grievances/:id/action-reports',newReport);router.patch('/grievances/:id/action-reports/:reportId',editReport);router.post('/grievances/:id/action-reports/:reportId/submit',submitReport);router.get('/grievances/:id',detail);
export default router;
