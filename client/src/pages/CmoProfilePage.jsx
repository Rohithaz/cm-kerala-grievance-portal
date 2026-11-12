import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { CmoHeading, CmoPanel } from '../components/CmoPortal.jsx';

export default function CmoProfilePage(){
  const {user,saveProfile}=useAuth();const [name,setName]=useState(user?.name||'');const [mobile,setMobile]=useState(user?.mobile||'');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  async function submit(event){event.preventDefault();setError('');setNotice('');setBusy(true);try{await saveProfile({name,mobile});setNotice('Profile details saved.')}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <><CmoHeading eyebrow="ACCOUNT" title="Profile" description="Manage your administrator display name and contact number."/><CmoPanel title="Administrator profile" eyebrow="SIGNED IN AS CMO ADMINISTRATOR"><form className="cmo-profile-form" onSubmit={submit}><label>Full name<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={160} required/></label><label>Email address<input value={user?.email||''} disabled readOnly/></label><label>Mobile number<input value={mobile} onChange={e=>setMobile(e.target.value)} required/></label><span className="cmo-profile-role">Role: CMO Administrator</span>{error&&<p className="cmo-form-error" role="alert">{error}</p>}{notice&&<p className="cmo-notice-success" role="status">{notice}</p>}<button className="cmo-button" disabled={busy}>{busy?'Saving…':'Save profile'}</button></form></CmoPanel></>;
}
