import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function CitizenLayout({ children }) {
  const { user, logout } = useAuth();
  return <div className="citizen-app">
    <div className="portal-notice">Assessment prototype · Not an official Government of Kerala service</div>
    <header className="portal-header"><Link className="portal-brand" to="/"><span className="brand-mark">K</span><span><b>CM Kerala</b><small>PUBLIC GRIEVANCE PORTAL</small></span></Link>
      <nav aria-label="Citizen portal"><NavLink end to="/citizen/dashboard">Overview</NavLink><NavLink to="/citizen/my-grievances">My grievances</NavLink><NavLink to="/citizen/submit-grievance">Submit</NavLink><NavLink to="/track-grievance">Track</NavLink></nav>
      <div className="portal-account"><span>{user?.name}</span><button type="button" onClick={logout}>Sign out</button></div>
    </header>
    <main className="portal-main">{children || <Outlet/>}</main>
    <footer className="portal-footer"><span>CM Kerala · Assessment prototype</span><span>Use fictional sample information only</span></footer>
  </div>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="portal-heading"><div><span className="portal-eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="portal-heading-action">{action}</div>}</div>;
}

export function LoadingState({ children = 'Loading your information…' }) { return <div className="portal-state" role="status"><span className="portal-spinner"/>{children}</div>; }
export function ErrorState({ message, retry }) { return <div className="portal-error" role="alert"><b>We couldn’t load this information.</b><p>{message}</p>{retry && <button type="button" className="portal-button secondary" onClick={retry}>Try again</button>}</div>; }
export function EmptyState({ title, description, action }) { return <div className="portal-empty"><span aria-hidden="true">○</span><h3>{title}</h3><p>{description}</p>{action}</div>; }
export function StatusPill({ status }) { return <span className={`status-pill status-${String(status).toLowerCase().replaceAll(' ', '-')}`}>{status}</span>; }
export function formatDate(value) { return value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : '—'; }
export function HistoryTimeline({ history = [] }) {
  if (!history.length) return <EmptyState title="No updates yet" description="Status updates will appear here as this grievance moves through review."/>;
  return <ol className="history-timeline">{history.map((item) => <li key={item.id}><span className="timeline-dot"/><div><div className="timeline-title"><b>{item.new_status}</b><time>{formatDate(item.created_at)}</time></div>{item.remarks && <p>{item.remarks}</p>}{item.changed_by_name && <small>Updated by {item.changed_by_name}</small>}</div></li>)}</ol>;
}
