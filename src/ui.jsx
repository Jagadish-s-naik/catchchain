import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from './ctx.jsx';

const PATHS = {
  fish: <><path d="M2 12s5-7 10-7 10 7 10 7-5 7-10 7-10-7-10-7z"/><circle cx="16" cy="12" r="2"/><path d="M22 12h-2M2 12h2"/></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/><line x1="4" y1="12" x2="20" y2="12" strokeDasharray="3 2"/></>,
  badge: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6" strokeDasharray="2 2"/></>,
  arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  check: <polyline points="20 6 9 17 4 12"/>,
  cross: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>,
  print: <><path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M6 14h12v7H6z"/></>,
  alert: <><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></>,
  whatsapp: <><circle cx="12" cy="5" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></>,
  anchor: <><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="21"/><path d="M5 12H3a9 9 0 0 0 18 0h-2"/></>,
  wifi: <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></>,
  wifiOff: <><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M1.42 9a15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></>,
  dispatch: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  receive: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  ice:<><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="5.64" y1="5.64" x2="18.36" y2="18.36"/><line x1="18.36" y1="5.64" x2="5.64" y2="18.36"/></>,
};

export function Icon({ name, size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className={`icon ${className}`} aria-hidden="true">
    {PATHS[name] || <circle cx="12" cy="12" r="4"/>}
    </svg>
  );
}

export function Toast(){
  const { toast, hideToast } = useApp();
  if (!toast) return null;
  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast toast-${toast.type || 'info'}`}>
        <span>{toast.message}</span>
        <button type="button" onClick={hideToast}
           style={{ background: `transparent`, border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px 6px'}}>✕</button>   
      </div>
      </div>
  );
}

export function OnlineBadge() {
  const { t } = useApp();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online',on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online',on); window.removeEventListener('offline',off); };
  }, []);
  return (
    <span className={`chip ${online ? 'chip-online' : 'chip-offline'}`} style={{ fontSize: '0.75rem' }}>
      <Icon name={online ? 'wifi' : 'wifiOff'} size={13} />
      {online ? t('onlineBadge') : t('offlineBadge')}
      </span>
  );
}

export function LangToggle() {
  const { lang, setLang } = useApp();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button type="button" className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
      <button type="button" className={`lang-btn ${lang === 'kn' ? 'active' : ''}`} onClick={() => setLang('kn')}>ಕನ್ನಡ</button>
    </div>
  );
}

export function Header() {
  const { session, logout, t } = useApp();
  const navigate = useNavigate();
  return (
    <header className="header-bar">
      <div className="header-inner container-wide">
        <Link to="/" className="header-brand" aria-label="CatchChain Home">
           <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',border: '2px solid var(--turmeric)'}}>
            <Icon name="anchor" size={17} color="var(--paper)" />
          </div>
          <span className="brand-title">{t('appName')}</span>
          </Link>
          <div className="header-actions">
            <OnlineBadge />
            {session && (
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/login')}
                style={{ minHeight: 36, padding: '0.25rem 0.65rem', fontSize: '0.85rem' }}>
                <Icon name="user" size={15} /><span className="hide-on-mobile">{t('switchRole')}</span>
                </button>
            )}
            {session && (
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/login')}
              style={{ minHeight: 36, padding:'0.25rem 0.65rem', fontSize: '0.85rem'}}>
              <Icon name="user" size={15} /><span className="hide-on-mobile">{t('switchRole')}</span>
              </button>
            )}
            {session && (
              <button type="button" className="btn btn-secondary" onClick={() => { logout(); navigate('/');}}
              style={{ minHeight: 36, padding: '0.25rem 0.65rem', fontSize: '0.85rem'}} title={t('logout')}>
              <Icon name = "logout" size={15} /><span className="hide-on-mobile">{t('logout')}</span>
              </button>
            )}
            <LangToggle/>
          </div>
        </div>
    </header>
  );
} 

export function Empty({ icon = 'fish', title, desc, action}) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem'}}>
      <div style={{width: 52, height: 52, borderRadius: '50%', backgroundColor: 'var(--bone)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color:'var(--ink)', marginBottom: '0.75rem'}}>
        <Icon name={icon} size={26} />
      </div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem'}}>{title}</h3>
      {desc && <p style={{ color: '#556677', fontSize: '0.9rem', marginBottom: '0.75rem'}}>{desc}</p>}
      {action && <div style={{ marginTop: '0.5rem'}}>{action}</div>}
    </div>
  );
}

export function Field({ label, helper, children}) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {children}
      {helper && <span className="form-helper">{helper}</span>}
    </div>
  );
}


export function NumPad({ value, onChange, max }) {
  const display = value === '' ? '0' : String(value);

  const press = (k) => {
    if (k === '⌫') {
      onChange(String(value).slice(0, -1) || '');
      return;
    }

    if (k === '.' && String(value).includes('.')) return;

    const next = (String(value) + k).replace(/^0+(\d)/, '$1');
    const num = parseFloat(next);

    if (!isNaN(max) && !isNaN(num) && num > max) return;

    onChange(next);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  return (
    <div>
      <div className="numpad-display">{display}</div>
      <div className="numpad" style={{ marginTop: '0.5rem' }}>
        {keys.map((k) => (
          <button
            type="button"
            key={k}
            className="numpad-key"
            onClick={() => press(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}



export function Badge({ status }) {
  const { t } =  useApp();
  const map = {
    sent: ['chip-sent', 'statusSent'], received: ['chip-paid', 'statusReceived'],
    disputed: ['chip-dispute', 'statusDisputed'], resolved: ['chip-sent','statusResolved']
  };
  const [cls,key] = map[status] || ['chip-sent','statusSent'];
  return <span className={`chip ${cls}`}>{t(key)}</span>
}