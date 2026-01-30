"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import StatusBadge from '../../../components/StatusBadge';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ToastProvider';
import { apiGet, apiPatch, apiPost } from '../../../lib/api-client';

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
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamDraft, setTeamDraft] = useState({});
  const [membersDraft, setMembersDraft] = useState([]);

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

  useEffect(() => {
    if (!editMode) return;
    if (!details?.team) return;
    setTeamDraft({
      team_name: details.team.team_name || '',
      college: details.team.college || '',
      preferred_track: details.team.preferred_track || '',
      problem_statement: details.team.problem_statement || '',
      team_level: details.team.team_level || '',
      participant_level: details.team.participant_level || '',
      team_size: details.team.team_size ?? '',
      venue_name: details.team.venue_name || '',
      venue_building: details.team.venue_building || '',
      venue_block: details.team.venue_block || '',
      venue_floor: details.team.venue_floor || '',
      venue_room: details.team.venue_room || '',
    });
    setMembersDraft(
      (details.members || []).map((m) => ({
        id: m.id,
        name: m.name || '',
        email: m.email || '',
        phone: m.phone || '',
        department: m.department || '',
        year_of_study: m.year || m.year_of_study || '',
        role: (m.role || '').toLowerCase() || 'member',
      }))
    );
  }, [editMode, details]);

  const team = details?.team || {};
  const members = details?.members || [];
  const problem = details?.problem || {};

  const teamState = team.team_state || 'registered';

  const evaluationStatus = useMemo(() => {
    if (team.evaluation_final) return 'Final';
    if (team.evaluation_2) return 'Eval 2';
    if (team.evaluation_1) return 'Eval 1';
    return '—';
  }, [team]);

  const submissionStatus = team.project_submitted_at ? 'Submitted' : 'Pending';
  const checkinStatus = team.checked_in_at ? 'Checked in' : 'Pending';

  const canVerifyPayment = teamState === 'registered';
  const canCheckIn = teamState === 'payment_verified';
  const canEvalComplete = teamState === 'ready_for_eval';
  const canOpenSubmission = teamState === 'eval_completed';

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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const qrPayload = team.qr_token || '';
  const qrImageSrc = qrPayload ? `${API_BASE}/qr/image?payload=${encodeURIComponent(qrPayload)}` : '';
  const qrViewHref = qrPayload ? `${API_BASE}/qr/view?payload=${encodeURIComponent(qrPayload)}` : '';

  const saveEdits = async () => {
    try {
      setSaving(true);
      // Team updates
      await apiPatch(`/admin/teams/${teamId}`, {
        ...teamDraft,
        team_size: teamDraft.team_size === '' ? null : Number(teamDraft.team_size),
      });

      // Member updates (sequential; small list)
      for (const m of membersDraft) {
        if (!m.id) continue;
        await apiPatch(`/admin/team-members/${m.id}`, {
          name: m.name,
          email: m.email,
          phone: m.phone,
          department: m.department,
          year_of_study: m.year_of_study,
          role: m.role,
        });
      }

      addToast('Team details updated', 'success');
      setEditMode(false);
      await loadTeam();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title={`Team ${teamId}`}>
      {error && <div className="panel">{error}</div>}

      <section className="panel">
        <div className="panel-header">
          <h3>Team Overview</h3>
          <StatusBadge status={team.team_state} />
        </div>
        <div className="detail-grid">
          <div>
            <span className="muted">Team Name</span>
            {editMode ? (
              <input className="input" value={teamDraft.team_name} onChange={(e) => setTeamDraft((p) => ({ ...p, team_name: e.target.value }))} />
            ) : (
              <strong>{team.team_name || '—'}</strong>
            )}
          </div>
          <div><span className="muted">Team ID</span><strong>{team.team_id || '—'}</strong></div>
          <div>
            <span className="muted">College</span>
            {editMode ? (
              <input className="input" value={teamDraft.college} onChange={(e) => setTeamDraft((p) => ({ ...p, college: e.target.value }))} />
            ) : (
              <strong>{team.college || '—'}</strong>
            )}
          </div>
          <div>
            <span className="muted">Preferred Track</span>
            {editMode ? (
              <input className="input" value={teamDraft.preferred_track} onChange={(e) => setTeamDraft((p) => ({ ...p, preferred_track: e.target.value }))} />
            ) : (
              <strong>{team.preferred_track || '—'}</strong>
            )}
          </div>
          <div><span className="muted">Payment Status</span><strong>{team.payment_status || '—'}</strong></div>
          <div><span className="muted">Check-in Status</span><strong>{checkinStatus}</strong></div>
          <div><span className="muted">Evaluation Progress</span><strong>{evaluationStatus}</strong></div>
          <div><span className="muted">Submission</span><strong>{submissionStatus}</strong></div>

          <div>
            <span className="muted">Team Level</span>
            {editMode ? (
              <input className="input" value={teamDraft.team_level} onChange={(e) => setTeamDraft((p) => ({ ...p, team_level: e.target.value }))} />
            ) : (
              <strong>{team.team_level || '—'}</strong>
            )}
          </div>
          <div>
            <span className="muted">Participant Level</span>
            {editMode ? (
              <input className="input" value={teamDraft.participant_level} onChange={(e) => setTeamDraft((p) => ({ ...p, participant_level: e.target.value }))} />
            ) : (
              <strong>{team.participant_level || '—'}</strong>
            )}
          </div>
          <div>
            <span className="muted">Team Size</span>
            {editMode ? (
              <input className="input" type="number" value={teamDraft.team_size} onChange={(e) => setTeamDraft((p) => ({ ...p, team_size: e.target.value }))} />
            ) : (
              <strong>{team.team_size ?? '—'}</strong>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {!editMode ? (
            <button className="button" onClick={() => setEditMode(true)}>Edit Details</button>
          ) : (
            <>
              <button className="button" onClick={saveEdits} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="button secondary" onClick={() => setEditMode(false)} disabled={saving}>Cancel</button>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Team Members</h3>
        <div className="member-grid">
          {(editMode ? membersDraft : members).map((member) => (
            <div key={member.id || member.email} className="member-card">
              <div className="member-header">
                {editMode ? (
                  <input className="input" value={member.name} onChange={(e) => setMembersDraft((prev) => prev.map((m) => (m.id === member.id ? { ...m, name: e.target.value } : m)))} />
                ) : (
                  <strong>{member.name || '—'}</strong>
                )}
                {editMode ? (
                  <select className="input" value={member.role} onChange={(e) => setMembersDraft((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: e.target.value } : m)))} style={{ maxWidth: 120 }}>
                    <option value="lead">Lead</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <span className={`badge ${member.role === 'lead' ? 'purple' : 'gray'}`}>
                    {member.role === 'lead' ? 'Lead' : 'Member'}
                  </span>
                )}
              </div>
              <div className="member-meta">
                {editMode ? (
                  <input className="input" placeholder="Email" value={member.email} onChange={(e) => setMembersDraft((prev) => prev.map((m) => (m.id === member.id ? { ...m, email: e.target.value } : m)))} />
                ) : (
                  <a href={member.email ? `mailto:${member.email}` : '#'}>{member.email || '—'}</a>
                )}

                {editMode ? (
                  <input className="input" placeholder="Phone" value={member.phone || ''} onChange={(e) => setMembersDraft((prev) => prev.map((m) => (m.id === member.id ? { ...m, phone: e.target.value } : m)))} />
                ) : (
                  <a href={member.phone ? `tel:${member.phone}` : '#'}>{member.phone || '—'}</a>
                )}

                <span>{member.gender || '—'}</span>

                {editMode ? (
                  <input className="input" placeholder="Department" value={member.department || ''} onChange={(e) => setMembersDraft((prev) => prev.map((m) => (m.id === member.id ? { ...m, department: e.target.value } : m)))} />
                ) : (
                  <span>{member.department || '—'}</span>
                )}

                {editMode ? (
                  <input className="input" placeholder="Year of study" value={member.year_of_study || ''} onChange={(e) => setMembersDraft((prev) => prev.map((m) => (m.id === member.id ? { ...m, year_of_study: e.target.value } : m)))} />
                ) : (
                  <span>{member.year || member.year_of_study || '—'}</span>
                )}

                <span>{member.register_no || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Problem Details</h3>
        <div className="detail-grid">
          <div>
            <span className="muted">Problem Idea</span>
            {editMode ? (
              <input className="input" value={teamDraft.problem_statement} onChange={(e) => setTeamDraft((p) => ({ ...p, problem_statement: e.target.value }))} />
            ) : (
              <strong>{problem.problem_statement || '—'}</strong>
            )}
          </div>
          <div><span className="muted">Why this problem</span><strong>{problem.why_statement || '—'}</strong></div>
          <div><span className="muted">Track / Domain</span><strong>{problem.preferred_track || '—'}</strong></div>
        </div>
      </section>

      <section className="panel">
        <h3>Venue Allocation</h3>
        <div className="detail-grid">
          <div>
            <span className="muted">Venue Name</span>
            {editMode ? (
              <input className="input" value={teamDraft.venue_name} onChange={(e) => setTeamDraft((p) => ({ ...p, venue_name: e.target.value }))} />
            ) : (
              <strong>{team.venue_name || '—'}</strong>
            )}
          </div>
          <div>
            <span className="muted">Building</span>
            {editMode ? (
              <input className="input" value={teamDraft.venue_building} onChange={(e) => setTeamDraft((p) => ({ ...p, venue_building: e.target.value }))} />
            ) : (
              <strong>{team.venue_building || '—'}</strong>
            )}
          </div>
          <div>
            <span className="muted">Block</span>
            {editMode ? (
              <input className="input" value={teamDraft.venue_block} onChange={(e) => setTeamDraft((p) => ({ ...p, venue_block: e.target.value }))} />
            ) : (
              <strong>{team.venue_block || '—'}</strong>
            )}
          </div>
          <div>
            <span className="muted">Floor</span>
            {editMode ? (
              <input className="input" value={teamDraft.venue_floor} onChange={(e) => setTeamDraft((p) => ({ ...p, venue_floor: e.target.value }))} />
            ) : (
              <strong>{team.venue_floor || '—'}</strong>
            )}
          </div>
          <div>
            <span className="muted">Room / Table</span>
            {editMode ? (
              <input className="input" value={teamDraft.venue_room} onChange={(e) => setTeamDraft((p) => ({ ...p, venue_room: e.target.value }))} />
            ) : (
              <strong>{team.venue_room || '—'}</strong>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Team QR</h3>
        <div className="qr-box">
          {qrImageSrc ? (
            <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
              <img src={qrImageSrc} alt="Team QR" />
              <a className="muted" href={qrViewHref} target="_blank" rel="noreferrer">
                Open QR in new tab
              </a>
            </div>
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
