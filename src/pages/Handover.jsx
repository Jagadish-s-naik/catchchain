// src/pages/Handover.jsx - Dispatch and Receive (two exported components)
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../ctx.jsx';
import { getBatchById, getHandoversByBatch, getParties, dispatchBatch, confirmHandover, getHandoverById, generateQrDataUrl, buildHandoverQrUrl, buildBatchQrUrl } from '../data.js';
import { available, pct, TOL } from '../chain.js';
import { Field, NumPad, Icon, Empty, Badge } from '../ui.jsx';

function NumStep({ title, value, onChange, max, onBack, t }) {
  return (
    <div className="container-narrow">
      <button type="button" className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={onBack}><Icon name="arrowLeft" size={16} />{t('back')}</button>
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
        <NumPad value={value} onChange={onChange} max={max} />
        <button type="button" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} onClick={onBack}>{t('close')}</button>
      </div>
    </div>
  );
}

function IceToggle({ id, value, onChange, t }) {
  return (
    <div className="grid-2">
      {[true, false].map((v) => (
        <button key={String(v)} type="button" id={`${id}-${v}`} className="btn"
          style={{ background: value === v ? 'var(--ink)' : 'var(--bone)', color: value === v ? 'var(--paper)' : 'var(--ink)', borderColor: value === v ? 'var(--ink)' : 'var(--line)' }}
          onClick={() => onChange(v)}>{v ? t('yes') : t('no')}</button>
      ))}
    </div>
  );
}

export function Dispatch() {
  const { batchId } = useParams(); const { t, session, showToast } = useApp(); const navigate = useNavigate();
  const batch = getBatchById(batchId), chain = getHandoversByBatch(batchId);
  const parties = getParties().filter((p) => p.id !== session.partyId && p.role !== 'officer');
  const avail = batch ? available(batch, chain) : 0;
  const [toId, setToId] = useState(''), [kg, setKg] = useState(String(avail)), [price, setPrice] = useState(batch ? String(batch.price) : '');
  const [iced, setIced] = useState(false), [iceIn, setIceIn] = useState(false), [step, setStep] = useState('form');
  const [qrUrl, setQrUrl] = useState(null), [ho, setHo] = useState(null);

  if (!batch) return <div className="container-narrow"><Empty icon="alert" title={t('notFound')} desc={t('notFoundDesc')} action={<Link to="/dash" className="btn btn-secondary">{t('back')}</Link>} /></div>;
  if (step === 'kg') return <NumStep title={`${t('kgToSend')} (max ${avail})`} value={kg} onChange={setKg} max={avail} onBack={() => setStep('form')} t={t} />;
  if (step === 'price') return <NumStep title={t('priceLabel')} value={price} onChange={setPrice} onBack={() => setStep('form')} t={t} />;

  async function submit() {
    if (!toId) { showToast(t('selectReceiver'), 'error'); return; }
    try {
      const h = dispatchBatch(batch, session.partyId, toId, parseFloat(kg), parseFloat(price), iced, iceIn);
      setHo(h); setQrUrl(await generateQrDataUrl(buildHandoverQrUrl(h.id))); setStep('done');
      showToast(t('handoverDispatched'), 'success');
    } catch (e) { showToast(t(e.message) || e.message, 'error'); }
  }

  if (step === 'done' && ho) {
    const recv = parties.find((p) => p.id === ho.toId);
    const waText = encodeURIComponent(`${t('appName')}: ${t('scanToReceive')} ${buildHandoverQrUrl(ho.id)}`);
    return (
      <div className="container-narrow"><div className="card" style={{ textAlign: 'center' }}>
        <Icon name="dispatch" size={32} color="var(--seaweed)" />
        <h2 style={{ margin: '0.75rem 0 0.25rem' }}>{t('handoverDispatched')}</h2>
        <p style={{ color: '#556677', marginBottom: '0.5rem' }}>{ho.id} â†’ {recv?.name}</p>
        {qrUrl && <img src={qrUrl} alt="Handover QR" style={{ width: 200, height: 200, margin: '0 auto 1rem', display: 'block' }} />}
        <div className="stack">
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer" id="share-wa-btn" className="btn btn-accent btn-full"><Icon name="whatsapp" size={18} />{t('shareWhatsApp')}</a>
          <Link to="/dash" className="btn btn-secondary btn-full">{t('back')}</Link>
        </div>
      </div></div>
    );
  }

  return (
    <div className="container-narrow">
      <div className="card" style={{ marginBottom: '1rem', borderLeft: '5px solid var(--seaweed)' }}>
        <h3>{batch.id} â€” {batch.species}</h3>
        <p style={{ color: '#556677', fontSize: '0.9rem' }}>{batch.harbour} Â· {t('availableKg', { kg: avail })}</p>
      </div>
      <div className="card">
        <h2 style={{ marginBottom: '1.25rem' }}>{t('dispatchHandover')}</h2>
        <Field label={t('receiverLabel')}><select id="receiver-select" className="form-select" value={toId} onChange={(e) => setToId(e.target.value)}><option value="">â€”</option>{parties.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}</select></Field>
        <Field label={t('kgToSend')}><button type="button" id="dispatch-kg-field" className="form-input" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setStep('kg')}><span>{kg || '0'} kg</span><Icon name="dispatch" size={16} color="#556677" /></button></Field>
        <Field label={t('priceLabel')}><button type="button" id="dispatch-price-field" className="form-input" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setStep('price')}><span>â‚¹{price || '0'}</span><Icon name="dispatch" size={16} color="#556677" /></button></Field>
        <Field label={t('keptOnIce')}><IceToggle id="iced" value={iced} onChange={setIced} t={t} /></Field>
        <Field label={t('weightIncludesIce')} helper={t('iceHint')}><IceToggle id="icein" value={iceIn} onChange={setIceIn} t={t} /></Field>
        <button type="button" id="dispatch-submit-btn" className="btn btn-accent btn-full" onClick={submit}><Icon name="dispatch" size={18} />{t('dispatchHandover')}</button>
      </div>
    </div>
  );
}

export function Receive() {
  const { handoverId } = useParams(); const { t, session, showToast } = useApp(); const navigate = useNavigate();
  const ho = getHandoverById(handoverId), parties = getParties();
  const [kg, setKg] = useState(''), [price, setPrice] = useState(ho ? String(ho.price) : '');
  const [iceInRecv, setIceInRecv] = useState(ho ? ho.iceIn : false), [step, setStep] = useState('form');

  if (!ho) return <div className="container-narrow"><Empty icon="alert" title={t('notFound')} desc={t('notFoundDesc')} action={<Link to="/dash" className="btn btn-secondary">{t('back')}</Link>} /></div>;
  if (ho.status !== 'sent') return <div className="container-narrow"><div className="card" style={{ textAlign: 'center' }}><Badge status={ho.status} /><p style={{ marginTop: '0.75rem', color: '#556677' }}>{t('receiptConfirmed')}</p><Link to={`/bill/${ho.id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>{t('billNumber')}</Link></div></div>;
  if (ho.toId !== session.partyId) return <div className="container-narrow"><div className="card" style={{ textAlign: 'center' }}><Icon name="alert" size={32} color="var(--laterite)" /><p style={{ margin: '0.75rem 0' }}>{t('addressedTo', { name: parties.find((p) => p.id === ho.toId)?.name || ho.toId })}</p><Link to="/login" className="btn btn-primary">{t('switchRole')}</Link></div></div>;

  const kgN = parseFloat(kg) || 0, prN = parseFloat(price) || 0;
  const wDiff = kgN > 0 ? pct(ho.kgSent, kgN) : 0, pDiff = prN > 0 ? pct(ho.price, prN) : 0;
  const hasDisp = wDiff > TOL || pDiff > TOL, iceDiff = iceInRecv !== ho.iceIn;

  async function submit() {
    const kk = parseFloat(kg), pp = parseFloat(price);
    if (!kk || kk <= 0) { showToast(t('errKgRequired'), 'error'); return; }
    if (!pp || pp <= 0) { showToast(t('errPriceRequired'), 'error'); return; }
    const { handover: upd } = confirmHandover(ho, kk, pp, iceInRecv);
    showToast(t('receiptConfirmed'), 'success'); navigate(`/bill/${upd.id}`);
  }

  if (step === 'kg') return <NumStep title={t('kgReceived')} value={kg} onChange={setKg} onBack={() => setStep('form')} t={t} />;
  if (step === 'price') return <NumStep title={t('agreedPrice')} value={price} onChange={setPrice} onBack={() => setStep('form')} t={t} />;

  return (
    <div className="container-narrow">
      <div className="card" style={{ marginBottom: '1rem', borderLeft: '5px solid var(--turmeric)' }}>
        <h3>{ho.batchId} â€” {t('confirmReceipt')}</h3>
        <p style={{ fontSize: '0.9rem', color: '#556677' }}>{t('kgToSend')}: <strong>{ho.kgSent} kg</strong> Â· â‚¹{ho.price}/kg</p>
        <p style={{ fontSize: '0.9rem', color: ho.iceIn ? 'var(--seaweed)' : '#556677', marginTop: '0.25rem' }}><Icon name="ice" size={14} />{' '}{ho.iceIn ? t('senderWithIce') : t('senderNoIce')}</p>
      </div>
      <div className="card">
        <Field label={t('kgReceived')}><button type="button" id="recv-kg-field" className="form-input" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setStep('kg')}><span>{kg || '0'} kg</span><Icon name="receive" size={16} color="#556677" /></button></Field>
        <Field label={t('agreedPrice')}><button type="button" id="recv-price-field" className="form-input" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setStep('price')}><span>â‚¹{price || '0'}</span><Icon name="receive" size={16} color="#556677" /></button></Field>
        <Field label={t('iceQ')}><IceToggle id="recv-ice" value={iceInRecv} onChange={setIceInRecv} t={t} /></Field>
        {(kgN > 0 || prN > 0) && (
          <div className={`recon-panel ${hasDisp ? 'recon-bad' : 'recon-ok'}`}>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{hasDisp ? t('disputeWillOpen') : t('matches')}</div>
            {kgN > 0 && <p style={{ fontSize: '0.875rem' }}>{t('weightDiff')}: {wDiff}%</p>}
            {prN > 0 && <p style={{ fontSize: '0.875rem' }}>{t('priceDiff')}: {pDiff}%</p>}
            {iceDiff && <p style={{ fontSize: '0.875rem', color: '#856404', fontWeight: 600, marginTop: '0.35rem' }}>âš  {t('iceDiffer')}</p>}
          </div>
        )}
        <button type="button" id="recv-submit-btn" className="btn btn-accent btn-full" style={{ marginTop: '1rem' }} onClick={submit} disabled={!kg || !price}><Icon name="receive" size={18} />{t('submitReceipt')}</button>
      </div>
    </div>
  );
}
