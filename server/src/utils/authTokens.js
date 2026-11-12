import jwt from 'jsonwebtoken';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

const issuer = 'cm-kerala-grievance-portal';
const audience = 'cm-kerala-client';

export function validateAuthConfiguration() {
  if (Buffer.byteLength(env.jwtSecret, 'utf8') < 32 || /replace_with|change_me|your_secret/i.test(env.jwtSecret)) {
    throw new Error('JWT_SECRET must be a configured random secret of at least 32 bytes.');
  }
  if (env.cookieSameSite === 'none' && !env.cookieSecure) {
    throw new Error('SameSite=None cookies require AUTH_COOKIE_SECURE=true.');
  }
  try { new URL(env.clientUrl); } catch { throw new Error('CLIENT_URL must be a valid origin URL.'); }
}

export function signSessionToken(user) {
  validateAuthConfiguration();
  return jwt.sign(
    { role: user.role },
    env.jwtSecret,
    { algorithm: 'HS256', subject: String(user.id), issuer, audience, expiresIn: env.jwtExpiresIn },
  );
}

export function verifySessionToken(token) {
  validateAuthConfiguration();
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'], issuer, audience });
}

function csrfSignature(nonce, sessionToken) {
  return createHmac('sha256', env.jwtSecret)
    .update(`cm-kerala-csrf:${nonce}:${sessionToken || 'anonymous'}`)
    .digest('base64url');
}

export function createCsrfToken(sessionToken = '') {
  validateAuthConfiguration();
  const nonce = randomBytes(32).toString('base64url');
  return `${nonce}.${csrfSignature(nonce, sessionToken)}`;
}

export function safeStringEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyCsrfToken(token, sessionToken = '') {
  if (typeof token !== 'string') return false;
  const splitAt = token.lastIndexOf('.');
  if (splitAt < 1) return false;
  const nonce = token.slice(0, splitAt);
  const supplied = token.slice(splitAt + 1);
  return safeStringEqual(supplied, csrfSignature(nonce, sessionToken));
}

export function getCookieOptions(overrides = {}) {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    ...overrides,
  };
}

export function setSessionCookie(res, token) {
  const payload = jwt.decode(token);
  const maxAge = Math.max(0, payload.exp * 1000 - Date.now());
  res.cookie(env.authCookieName, token, getCookieOptions({ maxAge }));
}

export function setCsrfCookie(res, token, maxAge) {
  const options = maxAge ? getCookieOptions({ maxAge }) : getCookieOptions();
  res.cookie(env.csrfCookieName, token, options);
}

export function clearAuthCookies(res) {
  res.clearCookie(env.authCookieName, getCookieOptions());
  res.clearCookie(env.csrfCookieName, getCookieOptions());
}