import { api } from './api.js';

const data = (promise) => promise.then(({ data: response }) => response.data);
export const getCmoDepartments = () => data(api.get('/cmo/departments'));
export const getCmoOfficers = (departmentId) => data(api.get(`/cmo/departments/${encodeURIComponent(departmentId)}/officers`));
export const getCmoStatistics = () => data(api.get('/cmo/statistics'));
export const getDistrictStatistics = () => data(api.get('/cmo/statistics/districts'));
export const getDepartmentStatistics = () => data(api.get('/cmo/statistics/departments'));
export const getCmoGrievances = (params) => data(api.get('/cmo/grievances', { params }));
export const getCmoGrievance = (id) => data(api.get(`/cmo/grievances/${encodeURIComponent(id)}`));
export const reviewGrievance = (id) => data(api.post(`/cmo/grievances/${encodeURIComponent(id)}/review`));
export const assignGrievance = (id, input) => data(api.post(`/cmo/grievances/${encodeURIComponent(id)}/assign`, input));
export const addCmoRemark = (id, input) => data(api.post(`/cmo/grievances/${encodeURIComponent(id)}/remarks`, input));
export const escalateGrievance = (id, input) => data(api.post(`/cmo/grievances/${encodeURIComponent(id)}/escalate`, input));
export const getCmoActionReports=params=>data(api.get('/cmo/action-reports',{params}));
export const getCmoActionReport=id=>data(api.get(`/cmo/action-reports/${encodeURIComponent(id)}`));
export const reviewCmoActionReport=(id,input)=>data(api.post(`/cmo/action-reports/${encodeURIComponent(id)}/review`,input));
export const reopenCmoGrievance=(id,reason)=>data(api.post(`/cmo/grievances/${encodeURIComponent(id)}/reopen`,{reason}));
export const analyzeCmoGrievance=id=>data(api.post(`/cmo/grievances/${encodeURIComponent(id)}/ai-analysis`,{}, {timeout:35000}));
