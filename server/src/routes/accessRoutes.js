import { Router } from 'express';
import { authenticateToken, authorizeRoles, requireActiveUser } from '../middleware/authMiddleware.js';

const router = Router();
const roleCheck = (req, res) => res.json({ success: true, data: { role: req.user.role, allowed: true } });
router.get('/citizen', authenticateToken, requireActiveUser, authorizeRoles('citizen'), roleCheck);
router.get('/cmo', authenticateToken, requireActiveUser, authorizeRoles('cmo_admin'), roleCheck);
router.get('/officer', authenticateToken, requireActiveUser, authorizeRoles('department_officer'), roleCheck);
export default router;