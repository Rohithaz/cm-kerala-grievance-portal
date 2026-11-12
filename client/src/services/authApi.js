import { api, setCsrfToken } from './api.js';

export async function initializeCsrf() {
  const { data } = await api.get('/auth/csrf');
  const token = data.data.csrfToken;
  setCsrfToken(token);
  return token;
}
export async function registerCitizen(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data.data.user;
}
export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload);
  setCsrfToken(data.data.csrfToken);
  return data.data;
}
export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data.user;
}
export async function logoutUser() {
  const { data } = await api.post('/auth/logout');
  setCsrfToken(null);
  return data;
}
export async function getProfile() {
  const { data } = await api.get('/users/profile');
  return data.data.user;
}
export async function updateProfile(payload) {
  const { data } = await api.put('/users/profile', payload);
  return data.data.user;
}