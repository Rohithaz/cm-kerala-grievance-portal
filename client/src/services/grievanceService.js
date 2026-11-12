import { api } from './api.js';

export const getGrievanceMeta = () => api.get('/grievances/meta').then(({ data }) => data.data);
export const submitGrievance = (body, onUploadProgress) => api.post('/grievances', body, { timeout: 60000, onUploadProgress }).then(({ data }) => data.data);
export const getMyStatistics = () => api.get('/grievances/my/statistics').then(({ data }) => data.data);
export const getMyGrievances = (params = {}) => api.get('/grievances/my', { params }).then(({ data }) => data.data);
export const getGrievance = (id) => api.get(`/grievances/${encodeURIComponent(id)}`).then(({ data }) => data.data);
export const getGrievanceHistory = (id) => api.get(`/grievances/${encodeURIComponent(id)}/history`).then(({ data }) => data.data);
export const trackGrievance = (reference) => api.get(`/grievances/track/${encodeURIComponent(reference)}`).then(({ data }) => data.data);
export const submitFeedback = (id, body) => api.post(`/grievances/${encodeURIComponent(id)}/feedback`, body).then(({ data }) => data.data);
export const analyzeDraftGrievance = (description) => api.post('/grievances/ai-analysis', { description }, { timeout: 35000 }).then(({ data }) => data.data);
export const getAttachmentUrl = (id) => `${api.defaults.baseURL}/grievances/attachments/${encodeURIComponent(id)}/download`;
