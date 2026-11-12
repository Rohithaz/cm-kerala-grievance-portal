import mysql from 'mysql2/promise';
import { env } from './env.js';
export const pool=mysql.createPool({...env.mysql,waitForConnections:true,connectionLimit:10,queueLimit:0,charset:'utf8mb4',enableKeepAlive:true});
pool.on('connection',connection=>connection.on('error',error=>console.error('MySQL connection error:',error.code||'UNKNOWN')));
export async function checkDatabase(){const connection=await pool.getConnection();try{await connection.ping();return true}finally{connection.release()}}
