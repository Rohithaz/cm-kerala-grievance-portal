import { useAuth } from '../context/AuthContext.jsx';

const titles = { citizen: 'Citizen', cmo_admin: 'CMO administrator', department_officer: 'Department officer' };
export default function PlaceholderDashboard({ role }) {
  const { user, logout } = useAuth();
  return <main className="dashboard-placeholder">
    <header className="dashboard-bar"><a className="brand" href="/"><span className="brand-mark">K</span><span><strong>CM Kerala</strong><small>ASSESSMENT PROTOTYPE</small></span></a><button className="text-button" onClick={logout}>Sign out</button></header>
    <section className="dashboard-card"><div className="eyebrow">{titles[role]} area</div><h1>Welcome, {user?.name}.</h1><p>Your account is signed in. Dashboard features will be added in a later phase.</p><span className="role-chip">{user?.role}</span></section>
  </main>;
}