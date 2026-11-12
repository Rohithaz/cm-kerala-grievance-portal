import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  { to: '/cmo/dashboard', label: 'Overview', icon: '▦' },
  { to: '/cmo/grievances', label: 'All grievances', icon: '▤' },
  { to: '/cmo/action-reports', label: 'Action reports', icon: '✓' },
  { to: '/cmo/grievances?priority=High', label: 'High priority', icon: '▲', search: '?priority=High' },
  { to: '/cmo/grievances?overdue=true', label: 'Overdue', icon: '◷', search: '?overdue=true' },
  { to: '/cmo/departments', label: 'Departments', icon: '⌂' },
  { to: '/cmo/profile', label: 'Profile', icon: '◉' },
];

export function CmoLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  return <div className="cmo-app">
    <aside className="cmo-sidebar">
      <Link className="cmo-brand" to="/cmo/dashboard"><span className="cmo-brandmark">K</span><span><b>CM Kerala</b><small>OFFICE CONSOLE</small></span></Link>
      <div className="cmo-nav-caption">WORKSPACE</div>
      <nav aria-label="CMO administration">{nav.map((item) => {
        const active = item.search
          ? location.pathname === '/cmo/grievances' && location.search === item.search
          : location.pathname === item.to && (!['/cmo/grievances'].includes(item.to) || !location.search);
        return <Link key={item.label} to={item.to} title={item.label} aria-label={item.label} className={`cmo-nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>;
      })}</nav>
      <div className="cmo-sidebar-bottom"><div className="cmo-account-dot">{user?.name?.slice(0,1)?.toUpperCase() || 'C'}</div><span><b>{user?.name}</b><small>CMO Administrator</small></span><button title="Sign out" onClick={logout}>↪</button></div>
    </aside>
    <div className="cmo-workspace">
      <header className="cmo-topbar"><div><span className="cmo-top-kicker">CHIEF MINISTER'S OFFICE</span><b>Grievance Administration</b></div><div className="cmo-top-actions"><span className="cmo-secure"><i/>Secure workspace</span><Link to="/cmo/profile">{user?.name}</Link></div></header>
      <main className="cmo-main"><Outlet/></main>
      <footer className="cmo-footer"><span>CM Kerala · Assessment prototype</span><span>For demonstration use only · Not an official government service</span></footer>
    </div>
  </div>;
}

export function CmoHeading({ eyebrow, title, description, action }) {
  return <div className="cmo-heading"><div><span className="cmo-eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div>{action}</div>}</div>;
}

export function CmoLoading({ label = 'Loading CMO workspace…' }) { return <div className="cmo-state" role="status"><span className="cmo-spinner"/>{label}</div>; }
export function CmoError({ message, retry }) { return <div className="cmo-error" role="alert"><b>Unable to load this view</b><p>{message}</p>{retry && <button onClick={retry}>Retry</button>}</div>; }
export function CmoEmpty({ title = 'No records found', description = 'There are no grievances matching this view.' }) { return <div className="cmo-empty"><span>▤</span><b>{title}</b><p>{description}</p></div>; }
export function CmoStatus({ status }) { return <span className={`cmo-status cmo-status-${String(status).toLowerCase().replaceAll(' ', '-')}`}>{status}</span>; }
export function CmoPriority({ priority }) { return <span className={`cmo-priority cmo-priority-${String(priority).toLowerCase()}`}><i/>{priority}</span>; }
export function cmoDate(value, time = false) { return value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', ...(time ? { timeStyle: 'short' } : {}) }).format(new Date(value)) : '—'; }
export function CmoPanel({ title, eyebrow, action, children, className = '' }) { return <section className={`cmo-panel ${className}`}><div className="cmo-panel-heading"><div>{eyebrow && <span className="cmo-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{action}</div>{children}</section>; }
