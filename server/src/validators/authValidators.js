import { httpError } from '../utils/httpError.js';

const allowedRegistrationKeys = new Set(['name', 'email', 'mobile', 'password', 'confirmPassword']);
const allowedProfileKeys = new Set(['name', 'mobile']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const mobilePattern = /^(?:\+91[ -]?)?[6-9]\d{9}$/;

function requireObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw httpError(400, 'A JSON object is required.');
}
function rejectUnknownKeys(body, allowed, message) {
  const extra = Object.keys(body).some((key) => !allowed.has(key));
  if (extra) throw httpError(400, message);
}
function cleanText(value) { return typeof value === 'string' ? value.trim() : ''; }
export function normalizeEmail(value) { return cleanText(value).toLowerCase(); }
export function normalizeMobile(value) { return cleanText(value).replace(/[ -]/g, ''); }

export function validateRegistration(body) {
  requireObject(body);
  rejectUnknownKeys(body, allowedRegistrationKeys, 'Registration accepts only name, email, mobile and password fields.');
  const name = cleanText(body.name);
  const email = normalizeEmail(body.email);
  const mobile = normalizeMobile(body.mobile);
  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
  if (!name || !email || !mobile || !password || !confirmPassword) throw httpError(400, 'All registration fields are required.');
  if (name.length < 2 || name.length > 160) throw httpError(400, 'Name must be between 2 and 160 characters.');
  if (email.length > 254 || !emailPattern.test(email)) throw httpError(400, 'Enter a valid email address.');
  if (!mobilePattern.test(mobile)) throw httpError(400, 'Enter a valid Indian mobile number.');
  if (Buffer.byteLength(password, 'utf8') > 72 || password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw httpError(400, 'Password must be 10 or more characters and include upper-case, lower-case, number and symbol characters.');
  }
  if (password !== confirmPassword) throw httpError(400, 'Password and confirmation do not match.');
  return { name, email, mobile, password };
}

export function validateLogin(body) {
  requireObject(body);
  rejectUnknownKeys(body, new Set(['email', 'password']), 'Login accepts only email and password.');
  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) throw httpError(400, 'Email and password are required.');
  if (email.length > 254 || !emailPattern.test(email)) throw httpError(400, 'Enter valid login credentials.');
  return { email, password };
}

export function validateProfile(body) {
  requireObject(body);
  rejectUnknownKeys(body, allowedProfileKeys, 'Only name and mobile can be updated.');
  const fields = {};
  if (Object.hasOwn(body, 'name')) {
    const name = cleanText(body.name);
    if (name.length < 2 || name.length > 160) throw httpError(400, 'Name must be between 2 and 160 characters.');
    fields.name = name;
  }
  if (Object.hasOwn(body, 'mobile')) {
    const mobile = normalizeMobile(body.mobile);
    if (!mobilePattern.test(mobile)) throw httpError(400, 'Enter a valid Indian mobile number.');
    fields.mobile = mobile;
  }
  if (!Object.keys(fields).length) throw httpError(400, 'Provide a name or mobile number to update.');
  return fields;
}