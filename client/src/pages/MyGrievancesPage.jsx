import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getGrievanceMeta, getMyGrievances } from '../services/grievanceService.js';
import { EmptyState, ErrorState, formatDate, LoadingState, PageHeading, StatusPill } from '../components/CitizenPortal.jsx';

const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Reopened'];
export default function MyGrievancesPage() {
  const [params, setParams] = useSearchParams(); const page = Math.max(1, Number(params.get('page')) || 1);
  const [meta, setMeta] = useState({ categories: [], districts: [] }); const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const status = params.get('status') || ''; const category = params.get('category') || ''; const district = params.get('district') || '';
  const load = useCallback(async () => { setLoading(true); setError(''); try { const [options, data] = await Promise.all([getGrievanceMeta(), getMyGrievances({ page, limit: 10, status, category, district })]); setMeta(options); setResult(data); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [page, status, category, district]);
  useEffect(() => { load(); }, [load]);
  function updateFilter(key, value) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.delete('page'); setParams(next); }
  return <>
    <PageHeading eyebrow="YOUR RECORDS" title="My grievances" description="Review your submissions and check their latest recorded status." action={<Link className="portal-button" to="/citizen/submit-grievance">＋ New grievance</Link>}/>
    <section className="filter-bar" aria-label="Filter grievances"><label>Status<select value={status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><label>Category<select value={category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{meta.categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>District<select value={district} onChange={(e) => updateFilter('district', e.target.value)}><option value="">All districts</option>{meta.districts.map((item) => <option key={item.id}>{item.name}</option>)}</select></label></section>
    {loading ? <LoadingState/> : error ? <ErrorState message={error} retry={load}/> : !result.items.length ? <EmptyState title="No matching grievances" description="Try changing the filters, or submit a new grievance." action={<Link className="portal-button" to="/citizen/submit-grievance">Submit a grievance</Link>}/> : <>
      <div className="table-wrap"><table className="grievance-table"><thead><tr><th>Reference</th><th>Concern</th><th>Priority</th><th>Assigned department</th><th>Submitted</th><th>Status</th><th/></tr></thead><tbody>{result.items.map((item) => <tr key={item.id}><td><Link className="reference-link" to={`/citizen/grievances/${item.id}`}>{item.reference_number}</Link></td><td><b>{item.subject}</b><small>{item.district} · {item.category}</small></td><td>{item.priority}</td><td>{item.assigned_department || 'Not assigned'}</td><td>{formatDate(item.created_at)}</td><td><StatusPill status={item.status}/></td><td><Link className="table-action" to={`/citizen/grievances/${item.id}`}>View</Link></td></tr>)}</tbody></table></div>
      <div className="pagination"><span>{result.pagination.total} grievance{result.pagination.total === 1 ? '' : 's'}</span><div><button type="button" className="portal-button secondary small" disabled={page <= 1} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page - 1)); setParams(next); }}>Previous</button><span>Page {page} of {Math.max(1, result.pagination.totalPages)}</span><button type="button" className="portal-button secondary small" disabled={page >= result.pagination.totalPages} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page + 1)); setParams(next); }}>Next</button></div></div>
    </>}
  </>;
}
