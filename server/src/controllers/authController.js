import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authenticateCredentials, getCurrentUser, registerCitizen } from '../services/authService.js';
import { clearAuthCookies, createCsrfToken, setSessionCookie, setCsrfCookie, signSessionToken } from '../utils/authTokens.js';

function tokenMaxAge(token) {
  const claims = jwt.decode(token);
  return Math.max(0, claims.exp * 1000 - Date.now());
}

export async function getCsrf(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const session = req.cookies?.[env.authCookieName] || '';
    const csrfToken = createCsrfToken(session);
    setCsrfCookie(res, csrfToken);
    res.json({ success: true, data: { csrfToken } });
  } catch (error) { next(error); }
}

export async function register(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const user = await registerCitizen(req.body);
    res.status(201).json({ success: true, data: { user } });
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const user = await authenticateCredentials(req.body);
    const token = signSessionToken(user);
    const maxAge = tokenMaxAge(token);
    const csrfToken = createCsrfToken(token);
    setSessionCookie(res, token);
    setCsrfCookie(res, csrfToken, maxAge);
    res.json({ success: true, data: { user, csrfToken } });
  } catch (error) { next(error); }
}

export async function me(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: { user: await getCurrentUser(req.user.id) } });
  } catch (error) { next(error); }
}

export function logout(req, res) {
  clearAuthCookies(res);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'You have been logged out.' });
}