"use client";

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiGet, apiPost } from '../../lib/api-client';

const MODES = ['registration', 'live', 'closed'];

export default function SettingsPage() {
  const { addToast } = useToast();
  const [mode, setMode] = useState('registration');
  const [warning, setWarning] = useState('');

  const loadMode = async () => {
    try {
      const data = await apiGet('/event/mode');
      setMode(data.mode || 'registration');
    } catch (err) {
      setWarning('Event mode API unavailable.');
    }
  };

  useEffect(() => {
    loadMode();
  }, []);

  const handleSave = async () => {
    try {
      await apiPost('/event/mode', { mode });
      addToast('Event mode updated', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <AppShell title="Settings">
      <section className="panel">
        <h3>Event Mode</h3>
        {warning && <p style={{ color: 'var(--warning)' }}>{warning}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value)} style={{ maxWidth: 220 }}>
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button className="button" onClick={handleSave}>Save</button>
        </div>
        <p style={{ color: 'var(--muted)', marginTop: 12 }}>
          Switching modes affects all teams. Ensure you are ready before moving the event forward.
        </p>
      </section>
    </AppShell>
  );
}
