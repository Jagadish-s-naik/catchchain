// src/pages/Scan.jsx - Camera QR scanner with manual ID fallback
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../ctx.jsx';
import { Icon, Field } from '../ui.jsx';

export default function Scan() {
  const { t, showToast } = useApp();
  const navigate = useNavigate();
  const [manual, setManual] = useState('');
  const [cameraDenied, setCameraDenied] = useState(false);
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);

  function handleQrText(text) {
    if (!mountedRef.current) return;
    if (text.includes('#/')) {
      navigate('/' + text.split('#/')[1]);
    } else if (text.startsWith('CB-')) {
      navigate(`/t/${text}`);
    } else if (text.startsWith('HO-')) {
      navigate(`/receive/${text}`);
    } else {
      showToast(t('errScan'), 'error');
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    let html5Scanner = null;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!mountedRef.current) return;
      html5Scanner = new Html5Qrcode('camera-reader-viewport');
      scannerRef.current = html5Scanner;
      html5Scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => { handleQrText(text); html5Scanner.stop().catch(() => {}); },
        () => {}
      ).catch(() => { if (mountedRef.current) setCameraDenied(true); });
    }).catch(() => { if (mountedRef.current) setCameraDenied(true); });
    return () => {
      mountedRef.current = false;
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, []);

  function handleManual() {
    const id = manual.trim().toUpperCase();
    if (id.startsWith('CB-')) navigate(`/t/${id}`);
    else if (id.startsWith('HO-')) navigate(`/receive/${id}`);
    else showToast(t('errScan'), 'error');
  }

  return (
    <div className="container-narrow">
      <h2 style={{ marginBottom: '0.4rem' }}>{t('scanTitle')}</h2>
      <p style={{ color: '#556677', marginBottom: '1.25rem', fontSize: '0.9rem' }}>{t('scanSubtitle')}</p>
      {!cameraDenied && (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '0.75rem' }}>
          <div id="camera-reader-viewport" style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', minHeight: 280, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="scan" size={48} color="#fff" />
          </div>
        </div>
      )}
      {cameraDenied && (
        <div className="card" style={{ marginBottom: '1.25rem', textAlign: 'center', padding: '2rem' }}>
          <Icon name="wifiOff" size={32} color="var(--laterite)" />
          <p style={{ marginTop: '0.75rem', color: '#556677' }}>{t('cameraDenied')}</p>
        </div>
      )}
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>{t('manualEntry')}</h3>
        <Field>
          <div className="row">
            <input id="manual-id-input" type="text" className="form-input" value={manual}
              onChange={(e) => setManual(e.target.value)} placeholder={t('batchIdPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && handleManual()} />
            <button type="button" id="manual-search-btn" className="btn btn-primary" onClick={handleManual}
              style={{ flexShrink: 0 }}>{t('scanSearch')}</button>
          </div>
        </Field>
      </div>
    </div>
  );
}
