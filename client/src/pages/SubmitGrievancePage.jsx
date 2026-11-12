import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeDraftGrievance, getGrievanceMeta, submitGrievance } from '../services/grievanceService.js';
import { ErrorState, LoadingState, PageHeading } from '../components/CitizenPortal.jsx';
import AiAnalysisPanel from '../components/AiAnalysisPanel.jsx';

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
export default function SubmitGrievancePage() {
  const [meta, setMeta] = useState(null); const [loadError, setLoadError] = useState(''); const [values, setValues] = useState({ district: '', category: '', subject: '', description: '' });
  const [files, setFiles] = useState([]); const [fieldError, setFieldError] = useState({}); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0); const [submitted, setSubmitted] = useState(null);
  const [aiAnalysis,setAiAnalysis]=useState(null);const [aiBusy,setAiBusy]=useState(false);const [aiError,setAiError]=useState('');
  useEffect(() => { let active = true; getGrievanceMeta().then((value) => { if (active) setMeta(value); }).catch((e) => { if (active) setLoadError(e.message); }); return () => { active = false; }; }, []);
  function change(event) { setValues((prev) => ({ ...prev, [event.target.name]: event.target.value })); setFieldError((prev) => ({ ...prev, [event.target.name]: '' })); if(event.target.name==='description'){setAiAnalysis(null);setAiError('');} }
  async function analyze(){setAiBusy(true);setAiError('');setAiAnalysis(null);try{setAiAnalysis(await analyzeDraftGrievance(values.description.trim()));}catch(e){setAiError(e.message);}finally{setAiBusy(false);}}
  function chooseFiles(event) {
    const selected = Array.from(event.target.files || []); const issue = selected.length > 5 ? 'Choose no more than five files.' : selected.find((file) => !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) ? 'Files must be PDF, JPG or PNG and no larger than 5 MB each.' : '';
    setFieldError((prev) => ({ ...prev, attachments: issue })); setFiles(issue ? [] : selected);
  }
  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setFieldError({});
    const next = {};
    if (!values.district) next.district = 'Select a district.';
    if (!values.category) next.category = 'Select a category.';
    if (values.subject.trim().length < 5 || values.subject.trim().length > 200) next.subject = 'Enter a subject from 5 to 200 characters.';
    if (values.description.trim().length < 20 || values.description.trim().length > 10000) next.description = 'Enter a description from 20 to 10000 characters.';
    if (fieldError.attachments) next.attachments = fieldError.attachments;
    if (Object.keys(next).length) { setFieldError(next); return; }
    const form = new FormData(); Object.entries(values).forEach(([key, value]) => form.append(key, value.trim())); files.forEach((file) => form.append('attachments', file));
    setBusy(true); setProgress(0);
    try { const result = await submitGrievance(form, (event) => { if (event.total) setProgress(Math.round(event.loaded * 100 / event.total)); }); setSubmitted(result); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  if (loadError) return <ErrorState message={loadError}/>;
  if (!meta) return <LoadingState>Loading districts and categories…</LoadingState>;
  if (submitted) return <section className="confirmation-card"><span className="confirmation-icon">✓</span><span className="portal-eyebrow">SUBMISSION RECEIVED</span><h1>Your grievance has been submitted.</h1><p>Keep this reference number to follow its progress.</p><div className="generated-reference">{submitted.reference_number}</div><div className="confirmation-actions"><Link className="portal-button" to={`/citizen/grievances/${submitted.id}`}>View grievance</Link><Link className="portal-button secondary" to="/citizen/dashboard">Back to overview</Link></div></section>;
  return <>
    <PageHeading eyebrow="NEW SUBMISSION" title="Tell us what happened." description="Share clear details so the concern can be reviewed and routed appropriately."/>
    {error && <div className="portal-error inline-error" role="alert">{error}</div>}
    <form className="portal-form" onSubmit={handleSubmit} noValidate>
      <div className="form-two"><label>District<select name="district" value={values.district} onChange={change} aria-invalid={!!fieldError.district}><option value="">Choose a district</option>{meta.districts.map((district) => <option key={district.id} value={district.name}>{district.name}</option>)}</select>{fieldError.district && <small className="field-error">{fieldError.district}</small>}</label>
      <label>Category<select name="category" value={values.category} onChange={change} aria-invalid={!!fieldError.category}><option value="">Choose a category</option>{meta.categories.map((category) => <option key={category}>{category}</option>)}</select>{fieldError.category && <small className="field-error">{fieldError.category}</small>}</label></div>
      <label>Subject<input name="subject" value={values.subject} onChange={change} maxLength={200} placeholder="A short summary of the concern" aria-invalid={!!fieldError.subject}/><span className="input-meta">{values.subject.length}/200 characters</span>{fieldError.subject && <small className="field-error">{fieldError.subject}</small>}</label>
      <label>Detailed description<textarea name="description" value={values.description} onChange={change} minLength={20} maxLength={10000} rows={7} placeholder="Describe where it happened, what you observed, and any relevant dates or details." aria-invalid={!!fieldError.description}/><span className="input-meta">{values.description.length}/10000 characters</span>{fieldError.description && <small className="field-error">{fieldError.description}</small>}</label>
      <AiAnalysisPanel analysis={aiAnalysis} busy={aiBusy} error={aiError} disabled={values.description.trim().length<20} onAnalyze={analyze}/>
      <label>Supporting documents <span className="optional-label">Optional</span><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={chooseFiles}/><small className="field-hint">Up to five PDF, JPG or PNG files; maximum 5 MB each.</small>{files.length > 0 && <small className="field-hint">{files.map((file) => file.name).join(' · ')}</small>}{fieldError.attachments && <small className="field-error">{fieldError.attachments}</small>}</label>
      <div className="form-footer"><p>We assign a tracking reference after successful submission. Initial priority is set to Medium.</p><button className="portal-button" type="submit" disabled={busy}>{busy ? `Submitting${progress ? ` · ${progress}%` : '…'}` : 'Submit grievance'}</button></div>
    </form>
  </>;
}
