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
    if (!payload || payload === lastScan) return;
    setLastScan(payload);

    try {
      const data = await apiPost('/qr/scan', { payload });
      addToast(`Checked in ${data.team_id}`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
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
        <h3>Manual QR Input</h3>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <input className="input" value={manualPayload} onChange={(e) => setManualPayload(e.target.value)} placeholder="Paste QR payload" />
          <button className="button secondary" onClick={handleManual}>Submit</button>
        </div>
      </section>
    </AppShell>
  );
}
