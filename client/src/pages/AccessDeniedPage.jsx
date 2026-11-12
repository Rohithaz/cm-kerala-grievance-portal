import { Link } from 'react-router-dom';
export default function AccessDeniedPage() {
  return <main className="auth-page"><section className="auth-card"><div className="eyebrow">ACCESS CONTROL</div><h1>That area is restricted.</h1><p>Your account does not have permission to view this page.</p><Link className="auth-primary" to="/">Return home</Link></section></main>;
}