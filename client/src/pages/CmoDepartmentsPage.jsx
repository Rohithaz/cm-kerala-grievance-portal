import { useCallback, useEffect, useState } from 'react';
import { CmoEmpty, CmoError, CmoHeading, CmoLoading, CmoPanel } from '../components/CmoPortal.jsx';
import { getCmoDepartments, getDepartmentStatistics } from '../services/cmoService.js';

export default function CmoDepartmentsPage(){
  const [data,setData]=useState(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const [departments,statistics]=await Promise.all([getCmoDepartments(),getDepartmentStatistics()]);setData(departments.map(d=>({...d,...statistics.find(s=>s.id===d.id)})));}catch(e){setError(e.message)}finally{setLoading(false)}},[]);useEffect(()=>{load()},[load]);
  return <><CmoHeading eyebrow="REFERENCE DIRECTORY" title="Departments" description="Current grievance distribution across seeded public departments."/>{loading?<CmoLoading/>:error?<CmoError message={error} retry={load}/>:<CmoPanel title="Department workload" eyebrow={`${data.length} DEPARTMENTS`}><div className="cmo-department-grid">{data.map(d=><article key={d.id}><div className="cmo-department-symbol">{d.name.slice(0,1)}</div><h3>{d.name}</h3><p>{d.description}</p><div className="cmo-dept-metrics"><span><b>{d.assigned}</b>Assigned</span><span><b>{d.in_progress}</b>In progress</span><span><b>{d.resolved}</b>Resolved</span><span><b>{d.overdue}</b>Overdue</span></div></article>)}{!data.length&&<CmoEmpty/>}</div></CmoPanel>}</>;
}
