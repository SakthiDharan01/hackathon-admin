"use client";

import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiPost } from '../../lib/api-client';

export default function AnnouncementsPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ title: '', body: '', priority: false });

  const handleSubmit = async () => {
    if (!form.title || !form.body) return;
    try {
      await apiPost('/announcements/public', form);
      addToast('Announcement published', 'success');
      setForm({ title: '', body: '', priority: false });
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <AppShell title="Announcements">
      <section className="panel">
        <h3>Public Announcement</h3>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="input"
            rows={3}
            placeholder="Message"
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.checked }))}
            />
            Priority
          </label>
          <button className="button" onClick={handleSubmit}>Publish</button>
        </div>
      </section>
    </AppShell>
  );
}
