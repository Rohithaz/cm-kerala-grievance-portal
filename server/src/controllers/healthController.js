import { checkDatabase } from '../config/database.js';
export function getHealth(req,res){res.json({success:true,message:'CM Kerala Grievance API is running'})}
export async function getDatabaseHealth(req,res,next){try{await checkDatabase();res.json({success:true,message:'Database connection is healthy'})}catch(error){error.status=503;next(error)}}
