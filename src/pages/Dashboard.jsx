import React from 'react';
import {Link} from 'react-router-dom';
import {useApp} from '../ctx.jsx';
import { getBatches,getHandovers,getPartyById } from '../data.js';
import { holder, available,overdue,amount } from '../chain.js';
import {Icon, Empty,Badge} from '../ui.jsx';

function fmtDate(ms) {
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString('en-IN', {day: 'numeric',month: 'short',hour: '2-digit',minute:'2-digit'});

}

export default function Dashboard() {
    const {t, session, tick} = useApp();
    const myId = session.partyId;
    const batches = getBatches();
    const handovers = getHandovers();

    const incoming = handovers.filter((h) => h.status === 'sent' && h.toId ===myId);
    const myBatches = batches.filter((b) => {
        const chain = handovers.filter((h) => h.batchId === b.id);
        return holder(b,chain) === myId && available(b,chain) > 0;
    });
    const myBills = handovers.filter((h) => h.fromId ===myId || h.toId ===myId)
        .filter((h) => h.status !== 'sent').slice(0,10);
    const isFisherOrAgent = session.role === 'fisher' || session.role === 'agent';

    return (
        <div className='container-narrow'>
            <div style={{marginBottom: '1.5rem'}}>
                <h2 style={{marginBottom: '0.1rem'}}>{t('dashGreeting',{name: session.name})}</h2>
                <p style={{color: '#556677',fontSize: '0.9rem'}}>{t(`role${session.role.charAt(0).toUpperCase() + session.role.slice(1)}`)}</p>

            </div>
            {isFisherOrAgent && (
                <Link to='/landing' id="register-catch-dash-btn" className="btn btn-accent btn-full" style={{marginBottom: '1.25rem'}}>
                    <Icon name="anchor" size={18} />{t('dashRegisterCatch')}
                </Link>
            )}
            <section style={{marginBottom: '1.25rem'}}>
                <h3 style={{marginBottom: '0.75rem'}}>{t('dashIncoming')} ({incoming.length})</h3>
                {incoming.length === 0
                  ? <Empty icon='receive' title={t('noIncoming')} />
                  : incoming.map((h) => {
                    const from = getPartyById(h.fromId);
                    return (
                        <div key={h.id} className='card row flex-between' style={{marginBottom: '0.75rem'}}>
                            <div>
                                <div style={{fontWeight: 700}}>{h.batchId} — {h.kgSent} kg</div>
                                <div style={{fontSize: '0.85rem', color: '#556677'}}>{t('billFrom')}: {from?.name} ·{fmtDate(h.sentAt)} </div>

                            </div>
                            <Link to={`/receive/${h.id}`} id={`recv-${h.id}`} className="btn btn-accent" style={{minHeight: 40, padding: '0.35rem 0.85rem', fontSize: '0.875rem'}}>
                                <Icon name="receive" size={15} /> {t('confirmReceipt')}
                            </Link>
                        </div>
                    );
                  })
                }
            </section>

            <section style={{marginBottom: '1.25rem'}}>
                <h3 style={{marginBottom: '0.75rem'}}>{t('dashInHands')} ({myBatches.length})</h3>
                {myBatches.length === 0
                  ? <Empty icon="fish" title={t('noBatchesInHands')} />
                  : myBatches.map((b) => {
                    const chain = handovers.filter((h) => h.batchId === b.id);
                    const avail = available(b,chain);
                    return (
                        <div key={b.id} className='card row flex-between' style={{marginBottom: '0.75rem'}}>
                            <div>
                                <div style={{fontWeight: 700}}>{b.id} — {b.species} </div>
                                <div style={{fontSize: '0.85rem', color: '#556677'}}>{b.harbour} · {t('availableKg', {kg: avail })}</div>

                            </div>
                            <Link to={`/handover/${b.id}`} id={`handover-${b.id}`} className="btn btn-primary" style={{minHeight: 40,padding: '0.35rem 0.85rem',fontSize: '0.875rem'}}>
                                <Icon name="dispatch" size={15} />{t('handOver')}
                            </Link>
                        </div>
                    );
                  })}
            </section>

            <section>
                <h3 style={{marginBottom: '0.75rem'}}>{t('dashRecentBills')} ({myBills.length})</h3>
                {myBills.length === 0
                  ? <Empty icon="print" title={t('noRecentBills')}/>
                  : myBills.map((h) => {
                    const isOverdue = overdue(h,Date.now());
                    const amt = amount(h);
                    return (
                        <Link key={h.id} to={`/bill/${h.id}`} className="card flex-between"
                            style={{textDecoration: 'none', marginBottom: '0.65rem',display: 'flex'}}>
                                <div>
                                    <div style={{fontWeight: 700}}>{h.id} — {h.batchId}</div>
                                    <div style={{fontSize: '0.85rem',color: '#556677'}}>{fmtDate(h.receivedAt)} · ₹{amt.toLocaleString('en-IN')}</div>

                                </div>
                                <div className='row' style={{gap: '0.35rem'}}>
                                    {isOverdue && <span className='chip chip-overdue'>{t('overdue')}</span>}
                                    <span className={`chip ${h.paid ? 'chip-paid' : 'chip-pending'}`}>{h.paid ? t('paid') : t('pending')}</span>

                                </div>
                            </Link>
                    );
                  })}
            </section>

        </div>
    );
}