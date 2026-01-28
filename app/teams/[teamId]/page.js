"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import StatusBadge from '../../../components/StatusBadge';
import { useToast } from '../../../components/ToastProvider';
import { apiGet, apiPost } from '../../../lib/api-client';
import usePoll from '../../../hooks/usePoll';

const STATE_ORDER = [
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
  const [team, setTeam] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [announcement, setAnnouncement] = useState({ title: '', body: '', priority: false });
  const [nextState, setNextState] = useState('');
  const [error, setError] = useState('');

  const loadTeam = async () => {
    try {
      setError('');
      const data = await apiGet('/teams');
      const found = (data.teams || []).find((item) => item.team_id === teamId);
      setTeam(found || null);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadChat = async () => {
    try {
      const data = await apiGet(`/team/${teamId}/chat`);
      setChat(data.messages || []);
    } catch (err) {
      addToast('Chat unavailable', 'error');
    }
  };

  useEffect(() => {
    loadTeam();
    loadChat();
  }, [teamId]);

  usePoll(loadChat, 7000);

  const timeline = useMemo(() => {
    return STATE_ORDER.map((state) => ({
      state,
      active: team?.team_state === state,
      completed: team ? STATE_ORDER.indexOf(team.team_state) > STATE_ORDER.indexOf(state) : false,
    }));
  }, [team]);

  const handleVerifyPayment = async () => {
    try {
      await apiPost(`/team/${teamId}/verify-payment`);
      addToast('Payment verified', 'success');
      loadTeam();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCheckIn = async () => {
    try {
      await apiPost(`/team/${teamId}/check-in`);
      addToast('Team checked in', 'success');
      loadTeam();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAdvance = async () => {
    if (!nextState) return;
    try {
      await apiPost(`/team/${teamId}/advance-state`, { next_state: nextState });
      addToast('State advanced', 'success');
      setNextState('');
      loadTeam();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      await apiPost(`/team/${teamId}/chat`, { message });
      setMessage('');
      loadChat();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleTeamAnnouncement = async () => {
    if (!announcement.title || !announcement.body) return;
    try {
      await apiPost(`/announcements/team/${teamId}`, announcement);
      addToast('Announcement sent', 'success');
      setAnnouncement({ title: '', body: '', priority: false });
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <AppShell title={`Team ${teamId}`}> 
      {error && <div className="panel">{error}</div>}
      <section className="panel">
        <div className="panel-header">
          <h3>Team Info</h3>
          <StatusBadge status={team?.team_state} />
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div><strong>Name:</strong> {team?.team_name || '—'}</div>
          <div><strong>Track:</strong> {team?.preferred_track || '—'}</div>
          <div><strong>Payment:</strong> {team?.payment_status || '—'}</div>
          <div><strong>Check-in:</strong> {team?.checked_in_at ? 'Checked in' : 'Pending'}</div>
          <div><strong>Evaluation:</strong> {team?.evaluation_final ? 'Final' : team?.evaluation_2 ? 'Eval 2' : team?.evaluation_1 ? 'Eval 1' : '—'}</div>
          <div><strong>Submission:</strong> {team?.project_submitted_at ? 'Submitted' : 'Pending'}</div>
        </div>
      </section>

      <section className="panel">
        <h3>Status Timeline</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          {timeline.map((item) => (
            <span
              key={item.state}
              className={`badge ${item.active ? 'purple' : item.completed ? 'green' : 'gray'}`}
            >
              {item.state.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Team Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="button" onClick={handleVerifyPayment}>Verify Payment</button>
          <button className="button" onClick={handleCheckIn}>Mark Checked In</button>
          <select className="input" value={nextState} onChange={(e) => setNextState(e.target.value)}>
            <option value="">Select next state</option>
            {STATE_ORDER.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <button className="button secondary" onClick={handleAdvance} disabled={!nextState}>Advance State</button>
        </div>
      </section>

      <section className="panel">
        <h3>Team Chat</h3>
        <div style={{ marginTop: 12, maxHeight: 300, overflowY: 'auto', display: 'grid', gap: 8 }}>
          {chat.map((msg) => (
            <div key={msg.id} style={{ background: '#121826', padding: 10, borderRadius: 10 }}>
              <strong style={{ textTransform: 'capitalize' }}>{msg.sender_role}</strong>
              <div>{msg.message}</div>
              <small style={{ color: 'var(--muted)' }}>{new Date(msg.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type message" />
          <button className="button" onClick={handleSendMessage}>Send</button>
        </div>
      </section>

      <section className="panel">
        <h3>Team Announcement</h3>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Title"
            value={announcement.title}
            onChange={(e) => setAnnouncement((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="input"
            rows={3}
            placeholder="Message"
            value={announcement.body}
            onChange={(e) => setAnnouncement((prev) => ({ ...prev, body: e.target.value }))}
          />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={announcement.priority}
              onChange={(e) => setAnnouncement((prev) => ({ ...prev, priority: e.target.checked }))}
            />
            Priority
          </label>
          <button className="button" onClick={handleTeamAnnouncement}>Send Announcement</button>
        </div>
      </section>
    </AppShell>
  );
}
