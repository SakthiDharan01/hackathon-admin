"use client";

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiGet, apiPost } from '../../lib/api-client';

export default function SubmissionsPage() {
  const { addToast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');

  const loadSubmissions = async () => {
    try {
      setError('');
      const data = await apiGet('/submissions');
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err.message);
      addToast('Unable to fetch submissions', 'error');
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const openSubmissions = async () => {
    const ok = window.confirm('Open project submissions for all eligible teams?');
    if (!ok) return;
    try {
      await apiPost('/submissions/open');
      addToast('Submissions opened', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const closeSubmissions = async () => {
    const ok = window.confirm('Close project submissions now?');
    if (!ok) return;
    try {
      await apiPost('/submissions/close');
      addToast('Submissions closed', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <AppShell title="Submissions">
      <section className="panel">
        <div className="panel-header">
          <h3>Team Submissions</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="button" onClick={openSubmissions}>Open Submissions</button>
            <button className="button danger" onClick={closeSubmissions}>Close Submissions</button>
            <button className="button secondary" onClick={loadSubmissions}>Refresh</button>
          </div>
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Status</th>
              <th>Project</th>
              <th>GitHub</th>
              <th>Live Demo</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((item) => (
              <tr key={item.id || item.team_id}>
                <td>{item.team_name || item.team_id}</td>
                <td>{item.submitted_at ? 'Submitted' : 'Pending'}</td>
                <td>{item.payload?.project_title || '—'}</td>
                <td>{item.submission_url ? <a href={item.submission_url} target="_blank">Repo</a> : '—'}</td>
                <td>{item.payload?.live_demo ? <a href={item.payload.live_demo} target="_blank">Live</a> : '—'}</td>
                <td>{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
