import { listDepartments } from '../services/departmentService.js';
const unavailableCodes=new Set(['ECONNREFUSED','ENOTFOUND','ETIMEDOUT','ER_ACCESS_DENIED_ERROR','ER_BAD_DB_ERROR']);
export async function getDepartments(req,res,next){try{res.json({success:true,data:await listDepartments()})}catch(error){if(unavailableCodes.has(error.code))error.status=503;next(error)}}
