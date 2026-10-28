import React, {useState} from 'react';
import { useNavigate,Link } from 'react-router-dom';
import {useApp} from '../ctx.jsx';
import {createBatch, generateQrDataUrl, buildBatchQrUrl, getHandoversByBatch, getParties} from '../data.js';
import {Field, Numpad, Icon} from '../ui.jsx';
import {SPECIES,HARBOURS } from '../chain.js';

export default function Landing() {
    const {t, session,showToast} = useApp();
    const navigate = useNavigate();
    const [species, setSpecies] = useState('');
    const [harbour, setHarbour] = useState('');
    const [kg, setKg] = useState('');
    const [price, setPrice] = useState('');
    const [landedAt, setLandedAt] = useState(() => new Date().toISOString().slice(0,16));
    const [step, setStep] = useState('form');
    const [batch, setBatch] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);

    async function handleSubmit() {
        if (!species) {showToast(t('errSpecies'), 'error'); return;}
        if (!harbour) {showToast (t('errHarbour'), 'error'); return;}
        const kgNum = parseFloat(kg);
        if (!kgNum || kgNum <= 0) { showToast(t('errKgRequired'),'error'); return;}
        const priceNum = parseFloat(price);
        if (!priceNum || priceNum <= 0) { showToast(t('errPriceRequired'),'error'); return;}
        const b = createBatch(session.partyId, species, harbour, new Date(landedAt).getTime(), kgNum,priceNum);
        const chain = getHandoversByBatch(b.id);
        const url = buildBatchQrUrl(b, chain, getParties());
        const dataurl = await generateQrDataUrl(url);
        setBatch(b); setQrUrl(dataurl); setStep('done');
        showToast(t('catchRegistered'), 'success');

        
    }
    if (step === 'done' && batch) {
        return (
            <div className='container-narrow'>
                <div className='card' style={{textAlign: 'center'}}>
                    <Icon name="anchor" size={32} color="var(--seaweed)" />
                    <h2 style={{margin: '0.75rem 0 0.25rem'}}>{t('catchRegistered')}</h2>
                    <p style={{color: 'var(--seaweed)', fontWeight: 700, fontSize: '1.25rem'}}>{batch.id}</p>
                    <p style={{color: '#556677', fontSize: '0.9rem',marginBottom: '1rem'}}>{batch.species} · {batch.harbour} . {batch.kg} kg</p>
                    {qrUrl && <img src={qrUrl} alt="Batch QR" style={{width: 200, height: 200, margin: '0 auto 1rem',display: 'block'}} />}
                    <div className='stack'>
                        <Link to={`/handover/${batch.id}`} id="handover-now-btn" className='btn btn-accent btn-full'>
                            <Icon name="dispatch" size={18} />{t('handOverNow')}
                        </Link>
                        <Link to="/dash" className='btn btn-secondary btn-full'>{t('back')}</Link>

                    </div>
                </div>
            </div>
        );
    }

    if (step === 'numpad-kg') {
        return (
            <div className='container-narrow'>
                <button type="button" className='btn btn-secondary' style={{marginBottom: '1rem'}} onClick={() => setStep('form')}>
                    <Icon name="arrowLeft" size={16} />{t('back')}
                </button>
                <div className='card'>
                    <h3 style={{marginBottom: '1rem'}}>{t('kgLabel')}</h3>
                    <Numpad value={kg} onChange={setKg} />
                    <button type='button' id="kg-done-btn" className='btn btn-primary btn-full' style={{marginTop: '1rem'}} onClick={() => setStep('form')}>{t('close')}</button>

                </div>
            </div>
        );

    }
    if (step === 'numpad-price') {
        return (
            <div className='container-narrow'>
                <button type="button" className="btn btn-secondary" style={{marginBottom: '1rem'}} onClick={() => setStep('form')}>
                    <Icon name='arrowLeft' size={16} />{t('back')}
                </button>
                <div className='card'>
                    <h3 style={{marginBottom: '1rem'}}>{t('priceLabel')}</h3>
                    <Numpad value={price} onChange={setPrice} />
                    <button type='button' id="price-done-btn" className='btn btn-primary btn-full' style={{marginTop: '1rem'}} onClick={() => setStep('form')}>{t('close')}</button>

                </div>
            </div>
        );
    }

    return (
        <div className='container-narrow'>
            <h2 style={{marginBottom: '1.25rem'}}>{t('registerCatch')}</h2>
            <div className='card'>
                <Field label={t('speciesLabel')}>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                        {SPECIES.map((s) => (
                            <button key={s} type='button' id={`species-${s}`}
                            className='btn' style={{minHeight: 40, padding: '0.35rem 0.85rem', fontSize: '0.9rem',background: species === s ? 'var(--ink)' : 'var(--bone)', color: species === s ? 'var(--paper)' : 'var(--ink)', borderColor: species === s ? 'var(--ink)' : 'var(--line)' }}
                            onClick={() => setSpecies(s)}>{s}</button>
                        ))}
                    </div>
                </Field>
                <Field label={t('harbourLabel')}>
                    <select id ="harbour-select" className='form-select' value={harbour} onChange={(e) => setHarbour(e.target.value)}>
                        <option value=""></option>
                        {HARBOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
             
                </Field>
                <Field label={t('kgLabel')}>
                    <button type="button" id="kg-field" className='form-input' style={{textAlign: 'left', cursor: 'pointer', display: 'flex',alignItems: 'center', justifyContent: 'space-between'}}
                        onClick={() => setStep('numpad-kg')}>
                        <span>{kg || '0'} kg </span><Icon name="dispatch" size={16} color="#556677" />

                    </button>
                </Field>
                <Field label={t('priceLabel')}>
                    <button type='button' id="price-field" className='form-input' style={{ textAlign: 'left',cursor: 'pointer',display: 'flex',alignItems: 'center',justifyContent: 'space-between'}}
                        onClick={() => setStep('numpad-price')}>
                            <span>₹{price || '0'}</span><Icon name="dispatch" size={16} color="#556677" />

                        </button>
                </Field>
                <Field label={t('landedAtLabel')}>
                    <input id="landed-at" type="datetime-local" className='form-input' value={landedAt} onChange={(e) => setLandedAt(e.target.value)} />

                </Field>
                <button type="button" id="register-catch-btn" className='btn btn-accent btn-full' onClick={handleSubmit}
                style={{marginTop: '0.5rem'}}>
                    <Icon name="anchor" size={18} />{t('registerCatch')}
                </button>
            </div>
        </div>
                
    );
}