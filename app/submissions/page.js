"use client";

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiGet } from '../../lib/api-client';

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

  return (
    <AppShell title="Submissions">
      <section className="panel">
        <div className="panel-header">
          <h3>Team Submissions</h3>
          <button className="button secondary" onClick={loadSubmissions}>Refresh</button>
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Status</th>
              <th>Submission URL</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((item) => (
              <tr key={item.id || item.team_id}>
                <td>{item.team_name || item.team_id}</td>
                <td>{item.submitted_at ? 'Submitted' : 'Pending'}</td>
                <td>{item.submission_url ? <a href={item.submission_url} target="_blank">Open</a> : '—'}</td>
                <td>{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
