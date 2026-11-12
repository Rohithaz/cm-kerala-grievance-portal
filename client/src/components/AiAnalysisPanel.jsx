import './aiAnalysis.css';

export default function AiAnalysisPanel({ analysis, busy, error, disabled = false, onAnalyze }) {
  return <section className="ai-analysis-panel" aria-labelledby="ai-assistant-title">
    <div className="ai-analysis-heading"><div><span className="ai-analysis-kicker">AI GRIEVANCE ASSISTANT</span><h2 id="ai-assistant-title">Review analysis suggestions</h2><p>Suggestions support human review. They do not change grievance fields or decisions.</p></div><button type="button" onClick={onAnalyze} disabled={busy || disabled}>{busy ? 'Analyzing…' : analysis ? 'Analyze again' : 'Analyze complaint'}</button></div>
    {error && <p className="ai-analysis-error" role="alert">{error}</p>}
    {analysis && <div className="ai-analysis-result" aria-live="polite"><div className="ai-generated-label">AI-generated suggestion · Review before use</div>
      {!analysis.sufficientInformation && <div className="ai-analysis-uncertain"><b>More information may be needed.</b><span>{analysis.uncertainty}</span></div>}
      <div className="ai-analysis-summary"><small>Short summary for CMO review</small><p>{analysis.summary}</p></div>
      <dl><div><dt>Suggested department</dt><dd>{analysis.suggestedDepartment || 'No suggestion'}</dd></div><div><dt>Suggested category</dt><dd>{analysis.suggestedCategory || 'No suggestion'}</dd></div><div><dt>Suggested priority</dt><dd>{analysis.suggestedPriority || 'No suggestion'}</dd></div></dl>
    </div>}
  </section>;
}
