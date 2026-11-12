import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const destinations = { citizen: '/citizen/dashboard', cmo_admin: '/cmo/dashboard', department_officer: '/officer/dashboard' };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const mobilePattern = /^(?:\+91[ -]?)?[6-9]\d{9}$/;
export default function RegisterPage() {
  const { user, loading, register, authError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  if (!loading && user) return <Navigate to={destinations[user.role] || '/'} replace />;

  function change(event) { setForm((value) => ({ ...value, [event.target.name]: event.target.value })); }
  async function handleSubmit(event) {
    event.preventDefault();
    setError(''); setSuccess('');
    if (!emailPattern.test(form.email.trim())) { setError('Enter a valid email address.'); return; }
    if (!mobilePattern.test(form.mobile.trim())) { setError('Enter a valid Indian mobile number.'); return; }
    if (form.password.length < 10 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) { setError('Use at least 10 characters with uppercase, lowercase, a number and a symbol.'); return; }
    if (form.password !== form.confirmPassword) { setError('Password and confirmation do not match.'); return; }
    setBusy(true);
    try {
      await register(form);
      setSuccess('Your citizen account was created. You can now sign in.');
      setForm({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
    } catch (submitError) { setError(submitError.message); }
    finally { setBusy(false); }
  }

  return <main className="auth-page"><section className="auth-card auth-card-wide">
    <Link className="auth-brand" to="/"><span className="brand-mark">K</span><span><strong>CM Kerala</strong><small>ASSESSMENT PROTOTYPE</small></span></Link>
    <div className="eyebrow">CITIZEN ACCESS</div><h1>Create your account.</h1><p className="auth-intro">Registration creates a citizen account for this assessment prototype.</p>
    {(error || authError) && <div className="notice-error" role="alert">{error || authError}</div>}
    {success && <div className="notice-success" role="status">{success} <Link to="/login">Sign in</Link></div>}
    <form onSubmit={handleSubmit} noValidate>
      <label>Full name<input name="name" autoComplete="name" value={form.name} onChange={change} required minLength={2} maxLength={160} /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={change} required maxLength={254} /></label>
      <label>Mobile number<input name="mobile" type="tel" autoComplete="tel" placeholder="10-digit Indian mobile number" value={form.mobile} onChange={change} required /></label>
      <label>Password<span className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={change} required /><button type="button" className="show-password" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
      <label>Confirm password<input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={change} required /></label>
      <button className="auth-primary" type="submit" disabled={busy || loading}>{busy ? 'Creating account…' : 'Create citizen account'}</button>
    </form>
    <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
    <p className="prototype-footnote">Administrative accounts cannot be created from public registration.</p>
  </section></main>;
}