import { useEffect, useState } from 'react';
import { getHealth } from '../services/api.js';
export default function ApiStatus() {
  const [state, setState] = useState('checking');
  useEffect(() => { getHealth().then(() => setState('connected')).catch(() => setState('offline')); }, []);
  return <span className={`api-status ${state}`}><i /> API {state}</span>;
}
