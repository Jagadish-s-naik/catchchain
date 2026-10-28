import React, { useState } from 'react';
import { HashRouter, Routes, Navigate, Link, useNavigate, Route } from 'react-router-dom';
import {Header, Toast, Icon, Empty } from './ui.jsx';
import {useApp} from './ctx.jsx';
import { getParties } from './data.js';
import Landing from './pages/Landing.jsx';
import { Dispatch, Receive } from './pages/Handover.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Bill from './pages/Bill.jsx';
import Trace from './pages/Trace.jsx';
import Officer from './pages/Officer.jsx';
import Scan from './pages/Scan.jsx';

const Guard = ({ children }) => {const {session} = useApp(); return session ? children : <Navigate to="/login" replace />; };
const OfficerGuard = ({ children }) => {const { session } = useApp(); if (!session) return <Navigate to="/login" replace />; return session.role === 'officer' ? children : <Navigate to="/dash" replace />; };

function NotFound() {
  const { t } = useApp();
  return <div className='container-narrow' style={{ paddingTop: '3rem' }}><Empty icon="alert" title={t('notFound')} desc={t('notFoundDesc')} action={<Link to="/" className='btn btn-primary'>{t('goHome')}</Link>} /></div>;
}

function Home() {
  const { t, session } = useApp();
  const cards = [
    {to: session ? '/dash' : '/login', icon: 'user', title: t('homeSignIn'), desc: t('homeSignInDesc'), bg: 'var(--ink)', tc: 'var(--paper)', bc: 'var(--ink)'},
    {to: '/scan', icon: 'scan', title: t('homeScan'), desc: t('homeScanDesc'), bg: 'var(--turmeric)', tc: 'var(--ink)', bc: 'var(--turmeric)'},
    {to: session?.role === 'officer' ? '/officer' : '/login', icon: 'badge', title: t('homeOfficer'), desc: t('homeOfficerDesc'), bg: 'var(--seaweed)', tc: '#fff', bc: 'var(--seaweed)'}

  ];
  return (
    <div className='container-narrow'>
      <div style={{textAlign: 'center', margin: '1.5rem 0 2rem'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: 'var(--radius-full)', background: '#E8F3ED', color: 'var(--seaweed)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.85rem' }}>
          <Icon name="anchor" size={15} color="var(--seaweed)" /><span>Mangaluru . Dakshina Kannada</span>
        </div>
        <h1 style={{fontSize: '2.1rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>{t('appName')}</h1>
        <p style={{color: '#445566',fontSize:'1.05rem', lineHeight: 1.5,maxWidth: 440, margin: '0 auto' }}>{t('appTagline')}</p>
      </div>
      <div className='stack'>
        {cards.map((c,i) => (
          <Link key={i} to={c.to} className='card' style={{textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderLeft: `5px solid ${c.bc}` }}>
            <div className='row'>
              <div style={{width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: c.bg, color: c.tc, display: 'flex',alignItems: 'center',justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={c.icon} size={24} color={c.tc} />
              </div>
              <div><h3 style={{fontSize: '1.15rem', marginBottom: '0.15rem' }}>{c.title}</h3><p style={{color: '#556677',fontSize: '0.875rem' }}>{c.desc}</p></div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>›</span>
          </Link>
        

        ))}
      </div>
    </div>
  );
}

function Login() {
  const {t, login, showToast } = useApp();
  const navigate = useNavigate();
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState('');
  const parties = getParties();
  const RL = { fisher: t('roleFisher'), agent: t('roleAgent'), transporter: t('roleTransporter'),wholesaler: t('roleWholesaler'), retailer: t('roleRetailer'), processor: t('roleProcessor'), officer: t('roleOfficer') };
  
  if (sel) return (
    <div className='container-narrow'>
      <button type='button' className='btn btn-secondary' style={{marginBottom: '1rem'}} onClick={() => {setSel(null); setPin(''); }}><Icon name='arrowLeft' size={16} />{t('back')}</button>
      <div className='card'>
        <h2 style={{marginBottom: '0.25rem' }}>{sel.name}</h2>
        <p style={{color: '#556677', marginBottom: '1.5rem' }}>{RL[sel.role]} . {sel.town}</p>
        <div className='form-group'>
          <label className='form-label'>{t('pinLabel')}</label>
          <input id='pin-input' type='password' className='form-input' inputMode='numeric' maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} placeholder='....' autoFocus />

        </div>
        <button type='button' id='login-btn' className='btn btn-primary btn-full' disabled={pin.length < 4}
          onClick={() => {if (pin !== sel.pin) {showToast(t('pinError'),'error'); return; } login(sel); navigate (sel.role === 'officer' ? '/officer' : '/dash'); }}>
          {t('homeSignIn')}
        </button>
      </div>
    </div>

  );
  return (
    <div className="container-narrow">
      <h2 style={{marginBottom: '0.25rem' }}> {t('homeSignIn')}</h2>
      <p style={{color: '#556677', marginBottom: '1.25rem', fontSize: '0.9rem' }}>{t('pinPrompt')}</p>
      <div className='stack'>
        {parties.map((p) => (
          <button key={p.id} type="button" id={`party-${p.id}`} className="card"
          style={{textAlign: 'left', cursor: 'pointer', border: '1px solid var(--line)',display: 'flex', alignItems: 'center', gap: '1rem', width: '100%'}}
          onClick={() => {setSel(p); setPin(''); }}>  
            <div style={{width: 44,height: 44, borderRadius: '50%',background: 'var(--bone)',display: 'flex' , alignItems: 'center',justifyContent: 'center', flexShrink: 0 }}><Icon name="user" size={22} /></div>
            <div><div style={{fontWeight: 700 }}>{p.name}</div><div style={{fontSize: '0.85rem',color: '#556677' }}>{RL[p.role]} . {p.town}</div></div>
            <span style={{ marginLeft: 'auto', fontSize: '1.4rem' }}>›</span>
          </button>
        ))}
    </div>
  </div>
  );
}
export default function App() {
  return (
    <HashRouter>
      <div className='app-container'>
        <Header />
        <main className='main-content'>
          <Routes>
            <Route path="/" element={<Home />}/>
            <Route path="/login" element={<Login />} />
            <Route path="/dash" element={<Guard><Dashboard /> </Guard>} />
            <Route path="/landing" element={<Guard><Landing /></Guard>} />
            <Route path="/handover/:batchId" element={<Guard><Dispatch /></Guard>} />
            <Route path="/receive/:handoverId" element={<Guard><Receive /></Guard>} />
            <Route path="/bill/:handoverId" element={<Guard><Bill /></Guard>} />
            <Route path="/t/:batchId" element={<Trace />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/officer" element={<OfficerGuard><Officer /></OfficerGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Toast />
      </div>
    </HashRouter>
  );
}