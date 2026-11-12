import bcrypt from 'bcryptjs';
import { createCitizenUser, findSafeUserById, findUserByEmail, updateSafeProfile } from '../models/userModel.js';
import { httpError } from '../utils/httpError.js';
import { normalizeEmail, validateLogin, validateProfile, validateRegistration } from '../validators/authValidators.js';

export function safeUser(user) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    departmentId: user.department_id === null ? null : Number(user.department_id),
    isActive: Boolean(user.is_active),
  };
}

export async function registerCitizen(body) {
  const input = validateRegistration(body);
  if (await findUserByEmail(input.email)) throw httpError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const user = await createCitizenUser({ ...input, passwordHash });
    return safeUser(user);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw httpError(409, 'An account with this email already exists.');
    throw error;
  }
}

export async function authenticateCredentials(body) {
  const { email, password } = validateLogin(body);
  const user = await findUserByEmail(normalizeEmail(email));
  if (!user) throw httpError(401, 'Invalid email or password.');
  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches || !Boolean(user.is_active)) throw httpError(401, 'Invalid email or password.');
  return safeUser(user);
}

export async function getCurrentUser(userId) {
  const user = await findSafeUserById(userId);
  if (!user || !Boolean(user.is_active)) throw httpError(401, 'Authentication required.');
  return safeUser(user);
}

export async function updateCurrentUser(userId, body) {
  const fields = validateProfile(body);
  const user = await updateSafeProfile(userId, fields);
  if (!user || !Boolean(user.is_active)) throw httpError(401, 'Authentication required.');
  return safeUser(user);
}