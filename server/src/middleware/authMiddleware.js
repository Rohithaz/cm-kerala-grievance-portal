import { env } from '../config/env.js';
import { pool } from '../config/database.js';
import { verifySessionToken } from '../utils/authTokens.js';
import { httpError } from '../utils/httpError.js';
import { safeUser } from '../services/authService.js';

const roles = new Set(['citizen', 'cmo_admin', 'department_officer']);

export async function authenticateToken(req, res, next) {
  const token = req.cookies?.[env.authCookieName];
  if (!token) return next(httpError(401, 'Authentication required.'));
  try {
    const claims = verifySessionToken(token);
    if (typeof claims.sub !== 'string' || !roles.has(claims.role)) throw httpError(401, 'Authentication required.');
    const [rows] = await pool.execute(
      `SELECT id, name, email, mobile, role, department_id, is_active
       FROM users WHERE id = ? LIMIT 1`,
      [claims.sub],
    );
    const user = rows[0];
    if (!user || !Boolean(user.is_active) || user.role !== claims.role) throw httpError(401, 'Authentication required.');
    req.user = safeUser(user);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
      return next(httpError(401, 'Authentication required.'));
    }
    next(error);
  }
}

export function requireActiveUser(req, res, next) {
  if (!req.user || !req.user.isActive) return next(httpError(401, 'Authentication required.'));
  next();
}

export function authorizeRoles(...allowedRoles) {
  const accepted = new Set(allowedRoles.flat());
  return (req, res, next) => {
    if (!req.user) return next(httpError(401, 'Authentication required.'));
    if (!accepted.has(req.user.role)) return next(httpError(403, 'You do not have permission to access this resource.'));
    next();
  };
}