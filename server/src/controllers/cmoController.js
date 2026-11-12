import { addCmoRemark, assignGrievance, escalateGrievance, getCmoDepartments, getCmoGrievance, getCmoStatistics, getDepartmentOfficers, getDepartmentStatistics, getDistrictStatistics, listCmoGrievances, reviewGrievance, listCmoActionReports, getCmoActionReport, reviewActionReport, reopenGrievance, getReportAttachment } from '../services/cmoService.js';
import { assignmentInput, cmoFilters, cmoId, cmoPagination, escalationInput, remarkInput } from '../validators/cmoValidators.js';
import { httpError } from '../utils/httpError.js';

const send = (res, data, message = undefined, status = 200) => res.status(status).json({ success: true, ...(message ? { message } : {}), data });

export async function departments(req, res) { send(res, await getCmoDepartments()); }
export async function officers(req, res) { send(res, await getDepartmentOfficers(cmoId(req.params.departmentId))); }
export async function statistics(req, res) { send(res, await getCmoStatistics()); }
export async function districtStatistics(req, res) { send(res, await getDistrictStatistics()); }
export async function departmentStatistics(req, res) { send(res, await getDepartmentStatistics()); }
export async function grievances(req, res) { send(res, await listCmoGrievances(cmoPagination(req.query), cmoFilters(req.query))); }
export async function grievance(req, res) { send(res, await getCmoGrievance(cmoId(req.params.id))); }
export async function review(req, res) {
  if (Object.keys(req.body || {}).length) throw httpError(400, 'Review does not accept a requested status or other body fields.');
  send(res, await reviewGrievance(cmoId(req.params.id), req.user.id), 'Grievance moved to Under Review.');
}
export async function assign(req, res) { send(res, await assignGrievance(cmoId(req.params.id), req.user.id, assignmentInput(req.body)), 'Grievance assignment saved.'); }
export async function remark(req, res) { send(res, await addCmoRemark(cmoId(req.params.id), req.user.id, remarkInput(req.body)), 'Remark added.', 201); }
export async function escalate(req, res) { send(res, await escalateGrievance(cmoId(req.params.id), req.user.id, escalationInput(req.body)), 'Grievance escalated.', 201); }
export async function actionReports(req,res){const page=Number(req.query.page||1),limit=Number(req.query.limit||10),status=req.query.status||'';if(!Number.isInteger(page)||page<1||!Number.isInteger(limit)||limit<1)throw httpError(400,'Invalid pagination.');if(status&&!['submitted','approved','changes_requested','draft'].includes(status))throw httpError(400,'Invalid report status.');send(res,await listCmoActionReports({page,limit:Math.min(limit,50),status}));}
export async function actionReport(req,res){send(res,await getCmoActionReport(cmoId(req.params.id)));}
export async function reviewAction(req,res){if(Object.keys(req.body||{}).some(k=>!['decision','remarks'].includes(k)))throw httpError(400,'Unexpected review fields.');const decision=req.body?.decision,remarks=typeof req.body?.remarks==='string'?req.body.remarks.trim():'';if(!['approve','request_changes'].includes(decision)||!remarks||remarks.length>5000)throw httpError(400,'Choose approve or request_changes and provide review remarks.');send(res,await reviewActionReport(cmoId(req.params.id),req.user.id,{decision,remarks}),'Action report reviewed.');}
export async function reopen(req,res){if(Object.keys(req.body||{}).some(k=>!['reason'].includes(k)))throw httpError(400,'Unexpected reopening fields.');const reason=typeof req.body?.reason==='string'?req.body.reason.trim():'';if(reason.length<5||reason.length>5000)throw httpError(400,'Reopening reason must be between 5 and 5000 characters.');send(res,await reopenGrievance(cmoId(req.params.id),req.user.id,reason),'Grievance reopened.');}
export async function reportAttachmentDownload(req,res,next){const a=await getReportAttachment(cmoId(req.params.attachmentId),req.user);res.set('X-Content-Type-Options','nosniff');res.download(a.absolutePath,a.original_filename,{headers:{'Content-Type':a.mime_type}},e=>{if(!e||res.headersSent)return;if(e.code==='ENOENT')return next(httpError(404,'Attachment file is unavailable.'));next(e);});}
