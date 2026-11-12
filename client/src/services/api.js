import axios from 'axios';

let csrfToken = null;
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (csrfToken && !['get', 'head', 'options'].includes(method)) {
    config.headers = config.headers || {};
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const wrapped = new Error(error.response?.data?.message || error.message || 'The service is unavailable.');
    wrapped.status = error.response?.status;
    wrapped.code = error.code;
    return Promise.reject(wrapped);
  },
);

export function setCsrfToken(token) { csrfToken = token || null; }
export const getHealth = () => api.get('/health').then(({ data }) => data);
export const getDepartments = () => api.get('/departments').then(({ data }) => data.data);