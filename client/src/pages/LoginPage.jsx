import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const destinations = { citizen: '/citizen/dashboard', cmo_admin: '/cmo/dashboard', department_officer: '/officer/dashboard' };
export default function LoginPage() {
  const { user, loading, login, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!loading && user) return <Navigate to={destinations[user.role] || '/'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (!password) { setError('Password is required.'); return; }
    setBusy(true);
    try {
      const signedIn = await login({ email, password });
      const intended = location.state?.from?.pathname;
      const target = destinations[signedIn.role] || '/';
      navigate(intended?.startsWith(target.split('/').slice(0, 2).join('/')) ? intended : target, { replace: true });
    } catch (submitError) { setError(submitError.message); }
    finally { setBusy(false); }
  }

  return <main className="auth-page"><section className="auth-card">
    <Link className="auth-brand" to="/"><span className="brand-mark">K</span><span><strong>CM Kerala</strong><small>ASSESSMENT PROTOTYPE</small></span></Link>
    <div className="eyebrow">WELCOME BACK</div><h1>Sign in to continue.</h1><p className="auth-intro">Use your assessment account to continue to your role area.</p>
    {(error || authError) && <div className="notice-error" role="alert">{error || authError}</div>}
    <form onSubmit={handleSubmit} noValidate>
      <label>Email address<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} /></label>
      <label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" className="show-password" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
      <button className="auth-primary" type="submit" disabled={busy || loading}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="auth-switch">New to the prototype? <Link to="/register">Create a citizen account</Link></p>
    <p className="prototype-footnote">Recruitment assessment only. Not an official government service.</p>
  </section></main>;
}