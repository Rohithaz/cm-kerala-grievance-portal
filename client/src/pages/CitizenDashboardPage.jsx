import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyGrievances, getMyStatistics } from '../services/grievanceService.js';
import { EmptyState, ErrorState, formatDate, LoadingState, PageHeading, StatusPill } from '../components/CitizenPortal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const metrics = [['total', 'All grievances'], ['submitted', 'Submitted'], ['under_review', 'Under review'], ['in_progress', 'In progress'], ['resolved', 'Resolved'], ['reopened', 'Reopened']];
export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const [statistics, list] = await Promise.all([getMyStatistics(), getMyGrievances({ page: 1, limit: 5 })]); setData({ statistics, recent: list.items }); } catch (e) { setError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  return <>
    <PageHeading eyebrow="CITIZEN PORTAL" title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}.`} description="Follow your submitted concerns and see the latest recorded progress." action={<Link className="portal-button" to="/citizen/submit-grievance">＋ Submit a grievance</Link>}/>
    {loading ? <LoadingState/> : error ? <ErrorState message={error} retry={load}/> : <>
      <section className="metric-grid" aria-label="Grievance statistics">{metrics.map(([key, label]) => <article className={`metric-card ${key === 'total' ? 'metric-featured' : ''}`} key={key}><span>{label}</span><strong>{data.statistics[key]}</strong></article>)}</section>
      <section className="portal-section"><div className="section-title"><div><span className="portal-eyebrow">YOUR ACTIVITY</span><h2>Recent grievances</h2></div><Link to="/citizen/my-grievances">View all →</Link></div>
        {!data.recent.length ? <EmptyState title="No grievances submitted yet" description="When you submit a concern, it will appear here with a tracking reference." action={<Link className="portal-button" to="/citizen/submit-grievance">Submit your first grievance</Link>}/> : <div className="table-wrap"><table className="grievance-table"><thead><tr><th>Reference</th><th>Concern</th><th>Date</th><th>Department</th><th>Status</th></tr></thead><tbody>{data.recent.map((item) => <tr key={item.id}><td><Link className="reference-link" to={`/citizen/grievances/${item.id}`}>{item.reference_number}</Link></td><td><b>{item.subject}</b><small>{item.district} · {item.category}</small></td><td>{formatDate(item.created_at)}</td><td>{item.assigned_department || 'Not assigned'}</td><td><StatusPill status={item.status}/></td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </>;
}
