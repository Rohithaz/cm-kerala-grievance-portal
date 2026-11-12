import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CmoEmpty } from '../components/CmoPortal.jsx';
import { CmoError, CmoHeading, CmoLoading, CmoPanel, CmoPriority, CmoStatus, cmoDate } from '../components/CmoPortal.jsx';
import { getCmoStatistics, getDepartmentStatistics, getDistrictStatistics } from '../services/cmoService.js';

function DistributionBars({ rows, labelKey, valueKey }) {
  if (!rows.length) return <CmoEmpty/>;
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey])));
  return <div className="cmo-bars">{rows.map((row) => <div className="cmo-bar-row" key={row.id || row[labelKey]}><span title={row[labelKey]}>{row[labelKey]}</span><div className="cmo-bar-track"><i style={{width:`${Math.max(Number(row[valueKey]) ? 4 : 0, Number(row[valueKey])*100/max)}%`}}/></div><b>{row[valueKey]}</b></div>)}</div>;
}

export default function CmoDashboardPage() {
  const [view,setView]=useState(null); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const [summary,districts,departments]=await Promise.all([getCmoStatistics(),getDistrictStatistics(),getDepartmentStatistics()]);setView({summary,districts,departments});}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{load();},[load]);
  if(loading)return <CmoLoading/>; if(error)return <CmoError message={error} retry={load}/>;
  const {statistics,recent,highPriority,overdue,escalated,activity}=view.summary;
  const cards=[['Total grievances',statistics.total,'▤','navy'],['Pending',statistics.pending,'◷','amber'],['Resolved',statistics.resolved,'✓','green'],['Overdue',statistics.overdue,'!','red'],['Reports submitted',view.summary.actionReports.total,'▣','navy'],['Reports awaiting review',view.summary.actionReports.pending,'◷','amber']];
  return <>
    <CmoHeading eyebrow="OVERVIEW" title="Grievance dashboard" description="Live caseload and recent activity across the portal." action={<Link className="cmo-button" to="/cmo/grievances">View all grievances <span>→</span></Link>}/>
    <section className="cmo-kpi-grid" aria-label="Grievance totals">{cards.map(([label,value,icon,tone])=><article className={`cmo-kpi cmo-kpi-${tone}`} key={label}><span className="cmo-kpi-icon">{icon}</span><small>{label}</small><strong>{value}</strong><span className="cmo-kpi-note">Current database total</span></article>)}</section>
    <section className="cmo-status-strip" aria-label="Status breakdown">{[['Submitted',statistics.submitted],['Under Review',statistics.under_review],['In Progress',statistics.in_progress],['Reopened',statistics.reopened],['High priority',statistics.high_priority]].map(([label,value])=><div key={label}><span>{label}</span><b>{value}</b></div>)}</section>
    <CmoPanel title="Action reports awaiting review" eyebrow="DEPARTMENT RESPONSES" action={<Link to="/cmo/action-reports">Review all reports →</Link>}>{view.summary.actionReports.recent.length?<div className="cmo-mini-list">{view.summary.actionReports.recent.map(r=><Link to={`/cmo/action-reports/${r.id}`} key={r.id}><span><b>{r.report_title}</b><small>{r.reference_number} · {r.department} · {r.officer}</small></span><i className="flag-overdue">Review</i></Link>)}</div>:<CmoEmpty title="No reports awaiting review" description="Department action reports will appear here when submitted."/>}</CmoPanel>
    <section className="cmo-dashboard-grid"><CmoPanel title="Recent grievances" eyebrow="LATEST SUBMISSIONS" action={<Link to="/cmo/grievances">Open queue →</Link>} className="cmo-panel-wide">
      {recent.length?<div className="cmo-table-scroll"><table className="cmo-table"><thead><tr><th>Reference</th><th>Concern</th><th>District</th><th>Priority</th><th>Status</th><th/></tr></thead><tbody>{recent.map((g)=><tr key={g.id}><td><Link className="cmo-ref" to={`/cmo/grievances/${g.id}`}>{g.reference_number}</Link></td><td><b>{g.subject}</b><small>{g.citizen_name}</small></td><td>{g.district}</td><td><CmoPriority priority={g.priority}/></td><td><CmoStatus status={g.status}/></td><td><Link className="cmo-row-link" to={`/cmo/grievances/${g.id}`}>Open</Link></td></tr>)}</tbody></table></div>:<CmoEmpty/>}
    </CmoPanel>
    <CmoPanel title="Latest administrative activity" eyebrow="AUDIT TRAIL" className="cmo-panel-activity">{activity.length?<ol className="cmo-activity">{activity.map((item,index)=><li key={`${item.activity_type}-${item.grievance_id}-${item.created_at}-${index}`}><span className={`cmo-activity-icon cmo-activity-${item.activity_type}`}>{item.activity_type==='escalation'?'!':item.activity_type==='assignment'?'↗':item.activity_type==='remark'?'✎':'↻'}</span><div><Link to={`/cmo/grievances/${item.grievance_id}`}>{item.reference_number}</Link><p>{item.summary}</p><small>{item.actor} · {cmoDate(item.created_at,true)}</small></div></li>)}</ol>:<CmoEmpty title="No administrative activity" description="Review, assignment, remark and escalation events will appear here."/>}</CmoPanel>
    <CmoPanel title="High-priority grievances" eyebrow="NEEDS ATTENTION" action={<Link to="/cmo/grievances?priority=High">View all →</Link>}>{highPriority.length?<div className="cmo-mini-list">{highPriority.slice(0,5).map(g=><Link to={`/cmo/grievances/${g.id}`} key={g.id}><span><CmoPriority priority={g.priority}/><b>{g.subject}</b><small>{g.reference_number} · {g.district}</small></span><CmoStatus status={g.status}/></Link>)}</div>:<CmoEmpty title="No open high-priority cases"/>}</CmoPanel>
    <CmoPanel title="Overdue grievances" eyebrow="PAST DUE" action={<Link to="/cmo/grievances?overdue=true">View all →</Link>}>{overdue.length?<div className="cmo-mini-list">{overdue.slice(0,5).map(g=><Link to={`/cmo/grievances/${g.id}`} key={g.id}><span><b>{g.subject}</b><small>{g.reference_number} · Due {cmoDate(g.due_at)}</small></span><CmoStatus status={g.status}/></Link>)}</div>:<CmoEmpty title="No overdue grievances" description="Grievances with a due date before the current database time will appear here."/>}</CmoPanel>
    <CmoPanel title="Escalated grievances" eyebrow="FOLLOW-UP REQUIRED">{escalated.length?<div className="cmo-mini-list">{escalated.slice(0,5).map(g=><Link to={`/cmo/grievances/${g.id}`} key={g.id}><span><b>{g.subject}</b><small>{g.reference_number} · {g.assigned_department||'Unassigned'}</small></span><i className="flag-escalated">Escalated</i></Link>)}</div>:<CmoEmpty title="No escalations" description="Escalation records will be highlighted here for follow-up."/>}</CmoPanel>
    <CmoPanel title="By department" eyebrow="CURRENT ASSIGNMENTS"><DistributionBars rows={view.departments.filter((row)=>row.assigned>0).slice(0,8)} labelKey="department" valueKey="assigned"/></CmoPanel>
    <CmoPanel title="By district" eyebrow="STATEWIDE DISTRIBUTION"><DistributionBars rows={view.districts.filter((row)=>row.total>0).slice(0,8)} labelKey="district" valueKey="total"/></CmoPanel>
    </section>
  </>;
}
