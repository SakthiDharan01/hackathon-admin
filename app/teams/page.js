"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { apiGet, apiPost } from '../../lib/api-client';
import usePoll from '../../hooks/usePoll';

const NEXT_STATE = {
  registered: 'payment_verified',
  payment_verified: 'checked_in',
  checked_in: 'eval_pending',
  eval_pending: 'ready_for_eval',
  ready_for_eval: 'eval_completed',
  eval_completed: 'project_submission_open',
  project_submission_open: 'project_submitted',
};

export default function TeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);

  const statusFilter = searchParams.get('status');

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiGet('/teams');
      setTeams(data.teams || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  usePoll(loadTeams, 20000);

  const filtered = useMemo(() => {
    if (!statusFilter) return teams;
    if (statusFilter === 'total') return teams;
    return teams.filter((team) => team.team_state === statusFilter);
  }, [teams, statusFilter]);

  const handleAction = (action, team) => {
    const next_state = action === 'advance' ? NEXT_STATE[team.team_state] : undefined;
    setConfirm({ action, team: { ...team, next_state } });
  };

  const executeAction = async () => {
    if (!confirm) return;
    const { action, team } = confirm;
    try {
      if (action === 'verify') {
        await apiPost(`/team/${team.team_id}/verify-payment`);
      }
      if (action === 'checkin') {
        await apiPost(`/team/${team.team_id}/check-in`);
      }
      if (action === 'advance') {
        await apiPost(`/team/${team.team_id}/advance-state`, { next_state: team.next_state });
      }
      addToast('Action completed', 'success');
      loadTeams();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <AppShell title="Teams">
      <section className="panel">
        <div className="panel-header">
          <h3>Teams Overview</h3>
          <button className="button secondary" onClick={loadTeams} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Team ID</th>
              <th>Team Name</th>
              <th>Track</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Check-in</th>
              <th>Eval</th>
              <th>Submission</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((team) => (
              <tr key={team.team_id}>
                <td>{team.team_id}</td>
                <td>{team.team_name || '—'}</td>
                <td>{team.preferred_track || '—'}</td>
                <td><StatusBadge status={team.team_state} /></td>
                <td>{team.payment_status || '—'}</td>
                <td>{team.checked_in_at ? '✓' : '—'}</td>
                <td>{team.evaluation_final ? 'Final' : team.evaluation_2 ? 'Eval 2' : team.evaluation_1 ? 'Eval 1' : '—'}</td>
                <td>{team.project_submitted_at ? 'Submitted' : 'Pending'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="button secondary" onClick={() => router.push(`/teams/${team.team_id}`)}>
                    Open
                  </button>
                  <button className="button" onClick={() => handleAction('verify', team)}>
                    Verify
                  </button>
                  <button className="button" onClick={() => handleAction('checkin', team)}>
                    Check-in
                  </button>
                  <button className="button" onClick={() => handleAction('advance', team)} disabled={!NEXT_STATE[team.team_state]}>
                    Advance
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ConfirmDialog
        open={!!confirm}
        title="Confirm action"
        description={`Proceed with ${confirm?.action} for ${confirm?.team?.team_id}${confirm?.team?.next_state ? ` → ${confirm?.team?.next_state}` : ''}?`}
        onConfirm={executeAction}
        onCancel={() => setConfirm(null)}
      />
    </AppShell>
  );
}
