import { Router } from 'express';
import { getCurrentUser, updateCurrentUser } from '../services/authService.js';
import { authenticateToken, requireActiveUser } from '../middleware/authMiddleware.js';

const router = Router();
router.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
router.use(authenticateToken, requireActiveUser);
router.get('/profile', async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
});
router.put('/profile', async (req, res, next) => {
  try { res.json({ success: true, data: { user: await updateCurrentUser(req.user.id, req.body) } }); }
  catch (error) { next(error); }
});
export default router;