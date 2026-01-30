"use client";

import { useEffect, useRef, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiPost } from '../../lib/api-client';

export default function CheckinPage() {
  const { addToast } = useToast();
  const videoRef = useRef(null);
  const [manualPayload, setManualPayload] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState('');
  const [lookup, setLookup] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const canConfirmCheckin =
    !!lookup?.team &&
    !lookup.team.checked_in_at &&
    lookup.team.team_state === 'payment_verified';

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleScan = async (payload) => {
    const trimmed = (payload || '').trim();
    if (!trimmed || trimmed === lastScan) return;
    setLastScan(trimmed);

    try {
      const data = await apiPost('/qr/lookup', { payload: trimmed });
      setLookup(data);
      addToast(`Found team ${data.team?.team_id || ''}`, 'success');
    } catch (err) {
      setLookup(null);
      addToast(err.message, 'error');
    }
  };

  const handleConfirmCheckin = async () => {
    if (!lookup?.payload) return;
    setCheckingIn(true);
    try {
      const data = await apiPost('/qr/scan', { payload: lookup.payload });
      addToast(`Checked in ${data.team_id}`, 'success');
      setLookup(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleDetect = async () => {
    if (!('BarcodeDetector' in window)) {
      addToast('QR scanner not supported. Use manual input.', 'error');
      return;
    }

    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    setScanning(true);

    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      const bitmap = await createImageBitmap(videoRef.current);
      const codes = await detector.detect(bitmap);
      if (codes.length) {
        handleScan(codes[0].rawValue);
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setScanning(false);
    }, 30000);
  };

  const handleManual = async () => {
    await handleScan(manualPayload.trim());
  };

  return (
    <AppShell title="Check-in">
      <section className="panel">
        <h3>QR Scanner</h3>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12, marginTop: 12 }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="button" onClick={handleDetect} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Start Scan'}
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>Scanned Team</h3>
        {lookup?.team ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="detail-grid">
              <div><span className="muted">Team ID</span><strong>{lookup.team.team_id || '—'}</strong></div>
              <div><span className="muted">Team Name</span><strong>{lookup.team.team_name || '—'}</strong></div>
              <div><span className="muted">Track</span><strong>{lookup.team.preferred_track || '—'}</strong></div>
              <div><span className="muted">College</span><strong>{lookup.team.college || '—'}</strong></div>
              <div><span className="muted">Status</span><strong>{lookup.team.team_state || '—'}</strong></div>
              <div><span className="muted">Payment</span><strong>{lookup.team.payment_status || '—'}</strong></div>
              <div><span className="muted">Checked in at</span><strong>{lookup.team.checked_in_at || '—'}</strong></div>
            </div>

            {lookup.members?.length ? (
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>Members</div>
                <div className="member-grid">
                  {lookup.members.map((m) => (
                    <div key={m.email} className="member-card">
                      <div className="member-header">
                        <strong>{m.name || '—'}</strong>
                        <span className={`badge ${m.role === 'lead' ? 'purple' : 'gray'}`}>
                          {m.role === 'lead' ? 'Lead' : 'Member'}
                        </span>
                      </div>
                      <div className="member-meta">
                        <a href={m.email ? `mailto:${m.email}` : '#'}>{m.email || '—'}</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="button" onClick={handleConfirmCheckin} disabled={checkingIn || !canConfirmCheckin}>
                {checkingIn ? 'Checking in…' : 'Confirm Check-in'}
              </button>
              <button className="button secondary" onClick={() => setLookup(null)} disabled={checkingIn}>
                Clear
              </button>
            </div>
            {!canConfirmCheckin ? (
              <div className="muted" style={{ fontSize: 12 }}>
                You can only check in after payment is verified.
              </div>
            ) : null}
            <div className="muted" style={{ fontSize: 12 }}>
              Tip: If your QR scanner returns a full URL (…/qr/view?payload=…), it’s supported.
            </div>
          </div>
        ) : (
          <span className="muted">Scan a QR to preview team details here.</span>
        )}
      </section>

      <section className="panel">
        <h3>Manual QR Input</h3>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <input className="input" value={manualPayload} onChange={(e) => setManualPayload(e.target.value)} placeholder="Paste QR payload" />
          <button className="button secondary" onClick={handleManual}>Submit</button>
        </div>
      </section>
    </AppShell>
  );
}
