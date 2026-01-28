"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import StatusBadge from '../../../components/StatusBadge';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ToastProvider';
import { apiGet, apiPost } from '../../../lib/api-client';

const STATUS_FLOW = [
  'registered',
  'payment_verified',
  'checked_in',
  'eval_pending',
  'ready_for_eval',
  'eval_completed',
  'project_submission_open',
  'project_submitted',
];

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const { addToast } = useToast();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);

  const loadTeam = async () => {
    try {
      setError('');
      const data = await apiGet(`/teams/${teamId}`);
      setDetails(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const team = details?.team || {};
  const members = details?.members || [];
  const problem = details?.problem || {};

  const evaluationStatus = useMemo(() => {
    if (team.evaluation_final) return 'Final';
    if (team.evaluation_2) return 'Eval 2';
    if (team.evaluation_1) return 'Eval 1';
    return '—';
  }, [team]);

  const submissionStatus = team.project_submitted_at ? 'Submitted' : 'Pending';
  const checkinStatus = team.checked_in_at ? 'Checked in' : 'Pending';

  const canVerifyPayment = team.team_state === 'registered';
  const canCheckIn = team.team_state === 'payment_verified';
  const canEvalComplete = team.team_state === 'ready_for_eval';
  const canOpenSubmission = team.team_state === 'eval_completed';

  const actions = [
    {
      key: 'verify',
      label: 'Verify Payment',
      enabled: canVerifyPayment,
      confirmText: 'Verify payment for this team?',
      handler: async () => apiPost(`/team/${teamId}/verify-payment`),
    },
    {
      key: 'checkin',
      label: 'Check In',
      enabled: canCheckIn,
      confirmText: 'Mark this team as checked in?',
      handler: async () => apiPost(`/team/${teamId}/check-in`),
    },
    {
      key: 'eval',
      label: 'Mark Eval Completed',
      enabled: canEvalComplete,
      confirmText: 'Mark evaluation as completed for this team?',
      handler: async () => apiPost(`/team/${teamId}/advance-state`, { next_state: 'eval_completed' }),
    },
    {
      key: 'submission',
      label: 'Open Submission',
      enabled: canOpenSubmission,
      confirmText: 'Open project submission for this team?',
      handler: async () => apiPost(`/team/${teamId}/advance-state`, { next_state: 'project_submission_open' }),
    },
    {
      key: 'lock',
      label: 'Lock Team',
      enabled: false,
      confirmText: 'Locking is not configured yet.',
      handler: async () => {},
    },
  ];

  const handleAction = (action) => {
    if (!action.enabled) return;
    setConfirm(action);
  };

  const executeAction = async () => {
    if (!confirm) return;
    try {
      await confirm.handler();
      addToast('Action completed', 'success');
      loadTeam();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setConfirm(null);
    }
  };

  const qrValue = team.qr_token ? encodeURIComponent(team.qr_token) : '';

  return (
    <AppShell title={`Team ${teamId}`}>
      {error && <div className="panel">{error}</div>}

      <section className="panel">
        <div className="panel-header">
          <h3>Team Overview</h3>
          <StatusBadge status={team.team_state} />
        </div>
        <div className="detail-grid">
          <div><span className="muted">Team Name</span><strong>{team.team_name || '—'}</strong></div>
          <div><span className="muted">Team ID</span><strong>{team.team_id || '—'}</strong></div>
          <div><span className="muted">College</span><strong>{team.college || '—'}</strong></div>
          <div><span className="muted">Preferred Track</span><strong>{team.preferred_track || '—'}</strong></div>
          <div><span className="muted">Payment Status</span><strong>{team.payment_status || '—'}</strong></div>
          <div><span className="muted">Check-in Status</span><strong>{checkinStatus}</strong></div>
          <div><span className="muted">Evaluation Progress</span><strong>{evaluationStatus}</strong></div>
          <div><span className="muted">Submission</span><strong>{submissionStatus}</strong></div>
        </div>
      </section>

      <section className="panel">
        <h3>Team Members</h3>
        <div className="member-grid">
          {members.map((member) => (
            <div key={member.email} className="member-card">
              <div className="member-header">
                <strong>{member.name || '—'}</strong>
                <span className={`badge ${member.role === 'lead' ? 'purple' : 'gray'}`}>
                  {member.role === 'lead' ? 'Lead' : 'Member'}
                </span>
              </div>
              <div className="member-meta">
                <a href={member.email ? `mailto:${member.email}` : '#'}>{member.email || '—'}</a>
                <a href={member.phone ? `tel:${member.phone}` : '#'}>{member.phone || '—'}</a>
                <span>{member.gender || '—'}</span>
                <span>{member.department || '—'}</span>
                <span>{member.year || '—'}</span>
                <span>{member.register_no || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Problem Details</h3>
        <div className="detail-grid">
          <div><span className="muted">Problem Idea</span><strong>{problem.problem_statement || '—'}</strong></div>
          <div><span className="muted">Why this problem</span><strong>{problem.why_statement || '—'}</strong></div>
          <div><span className="muted">Track / Domain</span><strong>{problem.preferred_track || '—'}</strong></div>
        </div>
      </section>

      <section className="panel">
        <h3>Team QR</h3>
        <div className="qr-box">
          {qrValue ? (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrValue}`}
              alt="Team QR"
            />
          ) : (
            <span className="muted">QR not available</span>
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Action Panel</h3>
        <div className="action-grid">
          {actions.map((action) => (
            <button
              key={action.key}
              className={`button ${action.key === 'lock' ? 'secondary' : ''}`}
              disabled={!action.enabled}
              onClick={() => handleAction(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={!!confirm}
        title="Confirm action"
        description={confirm?.confirmText || ''}
        onConfirm={executeAction}
        onCancel={() => setConfirm(null)}
      />
    </AppShell>
  );
}
