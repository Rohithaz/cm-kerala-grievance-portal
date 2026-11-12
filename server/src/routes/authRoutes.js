import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { getCsrf, login, logout, me, register } from '../controllers/authController.js';
import { authenticateToken, requireActiveUser } from '../middleware/authMiddleware.js';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Try again later.' },
});

router.get('/csrf', getCsrf);
router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticateToken, requireActiveUser, me);
router.post('/logout', authenticateToken, requireActiveUser, logout);
export default router;