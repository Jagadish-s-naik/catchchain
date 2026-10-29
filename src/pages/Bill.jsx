// src/pages/Bill.jsx - Bill view, mark paid, print, WhatsApp share
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../ctx.jsx';
import { getHandoverById, getBatchById, getPartyById, markHandoverPaid } from '../data.js';
import { amount, overdue } from '../chain.js';
import { Icon, Empty } from '../ui.jsx';

function fmtDate(ms) {
  if (!ms) return 'â€”';
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Bill() {
  const { handoverId } = useParams();
  const { t, session, showToast, tick } = useApp();
  const ho = getHandoverById(handoverId);
  if (!ho) return <div className="container-narrow"><Empty icon="alert" title={t('notFound')} desc={t('notFoundDesc')} action={<Link to="/dash" className="btn btn-secondary">{t('back')}</Link>} /></div>;

  const batch = getBatchById(ho.batchId);
  const from = getPartyById(ho.fromId);
  const to = getPartyById(ho.toId);
  const amt = amount(ho);
  const isOverdue = overdue(ho, Date.now());
  const isSender = session?.partyId === ho.fromId;
  const billNum = `BL-${ho.id}`;
  const waText = encodeURIComponent(`${billNum}: ${from?.name} â†’ ${to?.name} Â· ${ho.kgReceived ?? ho.kgSent} kg Â· â‚¹${amt.toLocaleString('en-IN')} Â· ${ho.paid ? t('paid') : t('pending')}`);

  function handleMarkPaid() {
    markHandoverPaid(ho.id);
    showToast(t('paid'), 'success');
  }

  return (
    <div className="container-narrow">
      <div className="card print-bill" style={{ marginBottom: '1rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.1rem' }}>{billNum}</h2>
            <p style={{ color: '#556677', fontSize: '0.875rem' }}>{fmtDate(ho.receivedAt)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {isOverdue && <span className="chip chip-overdue">{t('overdue')}</span>}
            {' '}
            <span className={`chip ${ho.paid ? 'chip-paid' : 'chip-pending'}`}>{ho.paid ? t('paid') : t('pending')}</span>
          </div>
        </div>
        <table className="table" style={{ marginBottom: '1rem' }}>
          <tbody>
            <tr><td className="form-label">{t('billFrom')}</td><td>{from?.name}</td></tr>
            <tr><td className="form-label">{t('billTo')}</td><td>{to?.name}</td></tr>
            <tr><td className="form-label">{t('billSpecies')}</td><td>{batch?.species}</td></tr>
            <tr><td className="form-label">{t('billKg')}</td>
              <td>
                {ho.kgReceived ?? ho.kgSent} kg
                {' '}<span className="chip chip-ice" style={{ fontSize: '0.75rem' }}>
                  <Icon name="ice" size={11} />{ho.iceIn ? t('iceIncl') : t('iceExcl')}
                </span>
              </td>
            </tr>
            <tr><td className="form-label">{t('billPrice')}</td><td>â‚¹{ho.priceAgreed ?? ho.price}/kg</td></tr>
            <tr><td className="form-label" style={{ fontWeight: 800, fontSize: '1.05rem' }}>{t('billAmount')}</td>
              <td style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--seaweed)' }}>â‚¹{amt.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="stack no-print">
        {isSender && !ho.paid && (
          <button type="button" id="mark-paid-btn" className="btn btn-accent btn-full" onClick={handleMarkPaid}>
            <Icon name="check" size={18} />{t('markPaid')}
          </button>
        )}
        <button type="button" id="print-btn" className="btn btn-secondary btn-full" onClick={() => window.print()}>
          <Icon name="print" size={18} />{t('printBill')}
        </button>
        <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer" id="bill-wa-btn"
          className="btn btn-secondary btn-full">
          <Icon name="whatsapp" size={18} />{t('shareWhatsApp')}
        </a>
        <Link to="/dash" className="btn btn-secondary btn-full">{t('back')}</Link>
      </div>
    </div>
  );
}
