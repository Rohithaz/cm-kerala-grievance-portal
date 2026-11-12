import { env } from '../config/env.js';
import { httpError } from '../utils/httpError.js';
import { safeStringEqual, verifyCsrfToken } from '../utils/authTokens.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const configuredOrigin = new URL(env.clientUrl).origin;

export function csrfProtection(req, res, next) {
  if (safeMethods.has(req.method)) return next();
  const origin = req.get('Origin');
  if (origin && origin !== configuredOrigin) return next(httpError(403, 'Request origin is not allowed.'));
  const sessionToken = req.cookies?.[env.authCookieName] || '';
  const cookieToken = req.cookies?.[env.csrfCookieName];
  const headerToken = req.get('X-CSRF-Token');
  if (!safeStringEqual(cookieToken, headerToken) || !verifyCsrfToken(headerToken, sessionToken)) {
    return next(httpError(403, 'A valid CSRF token is required.'));
  }
  next();
}