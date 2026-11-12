import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CmoEmpty, CmoError, CmoHeading, CmoLoading, CmoPriority, CmoStatus, cmoDate } from '../components/CmoPortal.jsx';
import { getGrievanceMeta } from '../services/grievanceService.js';
import { getCmoDepartments, getCmoGrievances } from '../services/cmoService.js';

const statuses=['Submitted','Under Review','In Progress','Resolved','Reopened']; const priorities=['Low','Medium','High'];
const keys=['search','district','category','priority','status','departmentId','overdue','direction'];
export default function CmoGrievancesPage(){
  const [params,setParams]=useSearchParams();
  const [meta,setMeta]=useState({districts:[],categories:[]}); const [departments,setDepartments]=useState([]); const [optionsError,setOptionsError]=useState('');
  const [draft,setDraft]=useState(Object.fromEntries(keys.map((key)=>[key,params.get(key)||''])));
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const page=Math.max(1,Number(params.get('page'))||1);
  useEffect(()=>{let active=true;Promise.all([getGrievanceMeta(),getCmoDepartments()]).then(([m,d])=>{if(active){setMeta(m);setDepartments(d);}}).catch(e=>{if(active)setOptionsError(e.message);});return()=>{active=false};},[]);
  const load=useCallback(async()=>{setLoading(true);setError('');const query=Object.fromEntries(keys.flatMap(key=>params.get(key)?[[key,params.get(key)]]:[]));query.page=page;query.limit=20;query.sort='created_at';try{setResult(await getCmoGrievances(query));}catch(e){setError(e.message);}finally{setLoading(false);}},[params,page]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{setDraft(Object.fromEntries(keys.map(key=>[key,params.get(key)||''])));},[params]);
  function change(event){setDraft((old)=>({...old,[event.target.name]:event.target.value}));}
  function apply(event){event.preventDefault();const next=new URLSearchParams();for(const key of keys)if(draft[key])next.set(key,draft[key]);next.set('page','1');setParams(next);}
  function clear(){setDraft(Object.fromEntries(keys.map(key=>[key,''])));setParams({page:'1'});}
  function changePage(nextPage){const next=new URLSearchParams(params);next.set('page',String(nextPage));setParams(next);}
  return <>
    <CmoHeading eyebrow="CASE MANAGEMENT" title="All grievances" description="Search, filter and open grievance records for administrative review." action={<span className="cmo-result-count">{result?.pagination.total ?? '—'} records</span>}/>
    {optionsError&&<div className="cmo-inline-warning" role="alert">Filter options unavailable: {optionsError}</div>}
    <form className="cmo-filters" onSubmit={apply}>
      <label className="cmo-search-field"><span>Search</span><input name="search" value={draft.search} onChange={change} placeholder="Reference number or subject" maxLength={120}/></label>
      <label><span>District</span><select name="district" value={draft.district} onChange={change}><option value="">All districts</option>{meta.districts.map(d=><option key={d.id}>{d.name}</option>)}</select></label>
      <label><span>Category</span><select name="category" value={draft.category} onChange={change}><option value="">All categories</option>{meta.categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label><span>Priority</span><select name="priority" value={draft.priority} onChange={change}><option value="">All priorities</option>{priorities.map(p=><option key={p}>{p}</option>)}</select></label>
      <label><span>Status</span><select name="status" value={draft.status} onChange={change}><option value="">All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
      <label><span>Department</span><select name="departmentId" value={draft.departmentId} onChange={change}><option value="">All departments</option>{departments.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select></label>
      <label><span>Submission date</span><select name="direction" value={draft.direction||'desc'} onChange={change}><option value="desc">Newest first</option><option value="asc">Oldest first</option></select></label>
      <label><span>Due date</span><select name="overdue" value={draft.overdue} onChange={change}><option value="">Any due date</option><option value="true">Overdue only</option><option value="false">Not overdue</option></select></label>
      <div className="cmo-filter-actions"><button className="cmo-button" type="submit">Apply filters</button><button className="cmo-button light" type="button" onClick={clear}>Reset</button></div>
    </form>
    {loading?<CmoLoading label="Loading grievance records…"/>:error?<CmoError message={error} retry={load}/>:!result?.items.length?<CmoEmpty title="No grievances match these filters" description="Change or reset the filters to see more records."/>:<>
      <div className="cmo-table-card"><div className="cmo-table-scroll"><table className="cmo-table cmo-wide-table"><thead><tr><th>Reference number</th><th>Subject / citizen</th><th>District</th><th>Category</th><th>Priority</th><th>Status</th><th>Department</th><th>Submitted</th><th>Flags</th><th>Action</th></tr></thead><tbody>{result.items.map((g)=><tr key={g.id}><td><Link className="cmo-ref" to={`/cmo/grievances/${g.id}`}>{g.reference_number}</Link></td><td><b>{g.subject}</b><small>{g.citizen_name}</small></td><td>{g.district}</td><td>{g.category}</td><td><CmoPriority priority={g.priority}/></td><td><CmoStatus status={g.status}/></td><td>{g.assigned_department||'Unassigned'}</td><td>{cmoDate(g.created_at,true)}</td><td><span className="cmo-flag-list">{g.is_overdue&&<i className="flag-overdue">Overdue</i>}{g.is_escalated&&<i className="flag-escalated">Escalated</i>}</span></td><td><Link className="cmo-row-link" to={`/cmo/grievances/${g.id}`}>Open →</Link></td></tr>)}</tbody></table></div></div>
      <div className="cmo-pagination"><span>Showing {result.items.length} of {result.pagination.total}</span><div><button className="cmo-button light" disabled={page<=1} onClick={()=>changePage(page-1)}>Previous</button><span>Page {page} of {Math.max(1,result.pagination.totalPages)}</span><button className="cmo-button light" disabled={page>=result.pagination.totalPages} onClick={()=>changePage(page+1)}>Next</button></div></div>
    </>}
  </>;
}
