import { useEffect, useState } from 'react';
import { getDepartments } from '../services/api.js';
import ApiStatus from '../components/ApiStatus.jsx';
const examples = [
 {name:'Public Works Department',description:'Roads, bridges and public infrastructure.'},
 {name:'Health and Family Welfare Department',description:'Public health services and facilities.'},
 {name:'Local Self Government Department',description:'Local civic services and community infrastructure.'},
];
export default function HomePage() {
 const [departments,setDepartments]=useState([]); const [state,setState]=useState('loading');
 useEffect(()=>{getDepartments().then(items=>{setDepartments(items);setState('ready')}).catch(()=>setState('unavailable'))},[]);
 const items=departments.length?departments.slice(0,3):examples;
 return <div className="page-shell">
  <div className="notice">Recruitment Assessment Prototype — This application is not an official Government of Kerala or Chief Minister's Office website.</div>
  <header className="topbar wrap"><a className="brand" href="/"><span className="brand-mark">K</span><span><strong>CM Kerala</strong><small>PUBLIC GRIEVANCE PORTAL</small></span></a><nav><a href="#about">About</a><a href="#departments">Departments</a><a href="#how">How it works</a><a href="/track-grievance">Track grievance</a><a href="mailto:hello@example.test">Contact</a><a href="/login">Sign in</a><a className="nav-contact" href="/register">Register</a></nav><ApiStatus/></header>
  <main>
   <section className="hero wrap"><div className="hero-copy"><div className="eyebrow"><i/>A clearer path to public service</div><h1>Your voice can<br/><em>move things forward.</em></h1><p>A simple place to raise a public service concern, follow its progress, and understand what happens next.</p><div className="actions"><a className="hero-action" href="/citizen/submit-grievance">Submit a grievance <b>↗</b></a><a className="hero-action outline" href="/track-grievance">Track a grievance <b>→</b></a></div><div className="auth-actions"><a href="/login">Sign in</a><a href="/register">Create citizen account</a></div><div className="sample">✳ &nbsp;Demonstration prototype · Sample information only</div></div>
    <div className="art" aria-hidden="true"><div className="sun"/><div className="orbit"/><div className="float"><b>✓</b><span>Clearer process<small>Submission to response</small></span></div><div className="hill back"/><div className="hill front"/><div className="water"/><div className="caption">LISTEN · ROUTE · RESPOND</div></div></section>
   <section className="trust"><div className="wrap trust-in"><small>BUILT AROUND YOUR CONCERN</small><span>One reference</span><span>Clear status updates</span><span>Relevant departments</span></div></section>
   <section className="intro wrap" id="about"><div><div className="eyebrow">THE PURPOSE</div><h2>A more transparent<br/>way to be heard.</h2></div><p>This assessment prototype explores how a grievance can move through review, department action and a clear response. The goal is a process that feels understandable at every step.</p></section>
   <section className="departments wrap" id="departments"><div className="section-head"><div><div className="eyebrow">PUBLIC SERVICES</div><h2>Connected to the right team.</h2></div><small>{state==='ready'?'Live department directory':state==='loading'?'Loading directory…':'Sample departments'}</small></div><div className="grid">{items.map((d,i)=><article key={d.id||d.name}><small>0{i+1}</small><b>↗</b><h3>{d.name}</h3><p>{d.description}</p></article>)}</div></section>
   <section className="how wrap" id="how"><div className="eyebrow">A SIMPLE JOURNEY</div><div className="steps"><div><small>01</small><b>Share the concern</b><p>Describe a public service issue and receive a reference.</p></div><div><small>02</small><b>Review and route</b><p>The CMO reviews it and directs it to a relevant department.</p></div><div><small>03</small><b>Follow the response</b><p>Track progress as the department investigates and responds.</p></div></div></section>
  </main><footer><div className="wrap"><span>CM Kerala · Assessment prototype</span><span>Fictional sample content · Not an official government service</span></div></footer></div>;
}
