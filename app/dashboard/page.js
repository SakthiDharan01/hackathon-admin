"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/ToastProvider';
import { apiGet } from '../../lib/api-client';
import usePoll from '../../hooks/usePoll';

const STAT_MAPPINGS = [
  { key: 'total', label: 'Total Teams' },
  { key: 'payment_verified', label: 'Payment Verified' },
  { key: 'checked_in', label: 'Checked In' },
  { key: 'ready_for_eval', label: 'Ready for Evaluation' },
  { key: 'project_submitted', label: 'Project Submitted' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [teams, setTeams] = useState([]);
  const [eventMode, setEventMode] = useState('—');
  const [error, setError] = useState('');

  const loadTeams = async () => {
    try {
      setError('');
      const data = await apiGet('/teams');
      setTeams(data.teams || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadEventMode = async () => {
    try {
      const data = await apiGet('/admin/event/mode');
      setEventMode(data.mode || '—');
    } catch (err) {
      setEventMode('—');
    }
  };

  useEffect(() => {
    loadTeams();
    loadEventMode();
  }, []);

  usePoll(loadTeams, 20000);
  usePoll(loadEventMode, 30000);

  const stats = useMemo(() => {
    const total = teams.length;
    const countByState = teams.reduce((acc, team) => {
      acc[team.team_state] = (acc[team.team_state] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      payment_verified: countByState.payment_verified || 0,
      checked_in: countByState.checked_in || 0,
      ready_for_eval: countByState.ready_for_eval || 0,
      project_submitted: countByState.project_submitted || 0,
    };
  }, [teams]);

  return (
    <AppShell
      title="Dashboard"
      actions={<button className="button secondary" onClick={() => addToast('Refreshing...', 'info')}>Refresh</button>}
    >
      <section className="panel">
        <div className="panel-header">
          <h3>Event Overview</h3>
          <StatusBadge status={eventMode} />
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <div className="stat-grid">
          {STAT_MAPPINGS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={stats[card.key] ?? 0}
              onClick={() => router.push(`/teams?status=${card.key}`)}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Latest Teams</h3>
          <button className="button secondary" onClick={() => router.push('/teams')}>
            View All
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Team ID</th>
              <th>Name</th>
              <th>Track</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {teams.slice(0, 6).map((team) => (
              <tr key={team.team_id}>
                <td>{team.team_id}</td>
                <td>{team.team_name || '—'}</td>
                <td>{team.preferred_track || '—'}</td>
                <td><StatusBadge status={team.team_state} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
