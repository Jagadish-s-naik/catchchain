// src/pages/Officer.jsx - Officer dashboard: KPIs, bar charts, disputes, flagged, lookup, data tools
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../ctx.jsx';
import { getBatches, getHandovers, getDisputes, getParties, getPartyById, exportData, importData, seed, tamperHandover, resolveDispute } from '../data.js';
import { summarize } from '../chain.js';
import { Icon } from '../ui.jsx';

const KPI = ({ label, value, color }) => (
  <div className="card" style={{ textAlign: 'center', borderTop: `4px solid ${color || 'var(--seaweed)'}` }}>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: color || 'var(--ink)' }}>{value}</div>
    <div style={{ fontSize: '0.85rem', color: '#556677', marginTop: '0.15rem' }}>{label}</div>
  </div>
);

const BarList = ({ items, maxKg }) => (
  <div>{items.map(({ k, kg }) => (
    <div key={k} className="bar-list-item">
      <div style={{ width: 90, fontSize: '0.85rem', flexShrink: 0 }}>{k}</div>
      <div style={{ flex: 1, background: 'var(--bone)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
        <div className="bar-fill" style={{ width: `${Math.round(kg / maxKg * 100)}%` }} />
      </div>
      <div style={{ fontSize: '0.82rem', color: '#556677', width: 56, textAlign: 'right' }}>{kg} kg</div>
    </div>
  ))}</div>
);

export default function Officer() {
  const { t, showToast, tick } = useApp(); const navigate = useNavigate();
  const [resolveId, setResolveId] = useState(null), [note, setNote] = useState(''), [lookup, setLookup] = useState('');
  const fileRef = useRef(null);

  const batches = getBatches(), handovers = getHandovers(), disputes = getDisputes(), parties = getParties();
  const now = Date.now(), sum = summarize({ batches, handovers, disputes, parties }, now);
  const maxH = sum.byHarbour[0]?.kg || 1, maxS = sum.bySpecies[0]?.kg || 1;
  const openDis = disputes.filter((d) => d.status === 'open');

  function doResolve(id) { resolveDispute(id, note); setResolveId(null); setNote(''); showToast(t('resolved'), 'success'); }
  function doExport() { const blob = new Blob([exportData()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'catchchain.json'; a.click(); }
  function doImport(e) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { try { importData(ev.target.result); showToast(t('importSuccess'), 'success'); } catch { showToast(t('importError'), 'error'); } }; r.readAsText(f); e.target.value = ''; }
  function doReset() { if (!window.confirm(t('resetDemo') + '?')) return; localStorage.clear(); seed(); showToast(t('resetSuccess'), 'success'); }
  function doTamper() { const ho = handovers.find((h) => h.status === 'received' || h.status === 'disputed'); if (!ho) { showToast('No received handover', 'error'); return; } tamperHandover(ho.id); showToast(t('tamperDone', { id: ho.batchId }), 'error'); }

  return (
    <div className="container-wide">
      <h2 style={{ marginBottom: '1.25rem' }}>{t('officerTitle')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <KPI label={t('totalKgCard')} value={sum.totalKg} color="var(--seaweed)" />
        <KPI label={t('lossKgCard')} value={sum.lossKg} color="var(--turmeric)" />
        <KPI label={t('lossPctCard')} value={`${sum.lossPct}%`} color="var(--turmeric)" />
        <KPI label={t('openDisputesCard')} value={sum.openDisputes} color={sum.openDisputes > 0 ? 'var(--laterite)' : 'var(--seaweed)'} />
        <KPI label={t('overdueCard')} value={sum.overdueCount} color={sum.overdueCount > 0 ? 'var(--laterite)' : 'var(--seaweed)'} />
      </div>
      <div className="grid-2" style={{ marginBottom: '1.25rem', alignItems: 'start' }}>
        <div className="card"><h3 style={{ marginBottom: '0.75rem' }}>{t('byHarbour')}</h3><BarList items={sum.byHarbour} maxKg={maxH} /></div>
        <div className="card"><h3 style={{ marginBottom: '0.75rem' }}>{t('bySpecies')}</h3><BarList items={sum.bySpecies} maxKg={maxS} /></div>
      </div>
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>{t('disputesTable')} ({openDis.length})</h3>
        {openDis.length === 0 ? <p style={{ color: '#556677' }}>â€”</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table"><thead><tr>
              <th>{t('colHandover')}</th><th>{t('colType')}</th><th>{t('colExpected')}</th><th>{t('colActual')}</th><th>{t('colDiff')}</th><th>{t('colIceBasis')}</th><th>{t('colAction')}</th>
            </tr></thead><tbody>
              {openDis.map((d) => (
                <React.Fragment key={d.id}>
                  <tr>
                    <td>{d.handoverId}</td><td>{d.type}</td><td>{d.expected}</td><td>{d.actual}</td><td>{d.diffPct}%</td>
                    <td><span className={`chip ${d.iceAgreed ? 'chip-paid' : 'chip-dispute'}`} style={{ fontSize: '0.75rem' }}>{d.iceAgreed ? t('iceAgreed') : t('iceNotAgreed')}</span></td>
                    <td><button type="button" id={`resolve-${d.id}`} className="btn btn-secondary" style={{ minHeight: 36, padding: '0.25rem 0.65rem', fontSize: '0.82rem' }} onClick={() => { setResolveId(d.id); setNote(''); }}>{t('resolve')}</button></td>
                  </tr>
                  {resolveId === d.id && (
                    <tr><td colSpan={7}><div className="row" style={{ padding: '0.5rem 0', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input type="text" className="form-input" style={{ flex: 1, minHeight: 40 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('resolveNote')} />
                      <button type="button" className="btn btn-accent" style={{ minHeight: 40 }} onClick={() => doResolve(d.id)}>{t('resolved')}</button>
                      <button type="button" className="btn btn-secondary" style={{ minHeight: 40 }} onClick={() => setResolveId(null)}>{t('cancel')}</button>
                    </div></td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody></table>
          </div>
        )}
      </div>
      {sum.flagged.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>{t('flaggedParties')}</h3>
          {sum.flagged.map(({ partyId, count }) => (
            <div key={partyId} className="row flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--line)' }}>
              <span>{getPartyById(partyId)?.name || partyId}</span>
              <span className="chip chip-dispute">{count} {t('disputes')}</span>
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>{t('provenanceLookup')}</h3>
        <div className="row">
          <input id="lookup-input" type="text" className="form-input" value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder={t('batchIdInput')} onKeyDown={(e) => e.key === 'Enter' && lookup && navigate(`/t/${lookup.trim().toUpperCase()}`)} />
          <button type="button" id="lookup-btn" className="btn btn-primary" style={{ flexShrink: 0 }} onClick={() => lookup && navigate(`/t/${lookup.trim().toUpperCase()}`)}>{t('lookup')}</button>
        </div>
      </div>
      <div className="card"><h3 style={{ marginBottom: '0.75rem' }}>Data</h3>
        <div className="stack">
          <button type="button" id="export-btn" className="btn btn-secondary btn-full" onClick={doExport}><Icon name="dispatch" size={16} />{t('exportJson')}</button>
          <button type="button" id="import-btn" className="btn btn-secondary btn-full" onClick={() => fileRef.current?.click()}><Icon name="receive" size={16} />{t('importJson')}</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={doImport} />
          <button type="button" id="reset-btn" className="btn btn-danger btn-full" onClick={doReset}><Icon name="cross" size={16} />{t('resetDemo')}</button>
          <button type="button" id="tamper-btn" className="btn btn-secondary btn-full" style={{ borderColor: 'var(--laterite)', color: 'var(--laterite)' }} onClick={doTamper}><Icon name="alert" size={16} color="var(--laterite)" />{t('tamperDemo')}</button>
        </div>
      </div>
    </div>
  );
}
