"use client";

import { useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { apiGet, apiPost } from '../../lib/api-client';

const STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered' },
  { value: 'payment_verified', label: 'Payment Verified' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'ready_for_eval', label: 'Ready for Eval' },
  { value: 'project_submitted', label: 'Project Submitted' },
];

export default function EmailsPage() {
  const { addToast } = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [include, setInclude] = useState('leads');
  const [statuses, setStatuses] = useState([]);
  const [teamIds, setTeamIds] = useState('');
  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const recipientsPayload = useMemo(() => {
    return {
      target,
      team_ids: teamIds
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      statuses,
      include,
    };
  }, [target, teamIds, statuses, include]);

  const renderPreview = () => {
    const sample = {
      team_name: 'Team Nova',
      team_id: 'AIW-1234',
      team_state: 'registered',
    };

    return body
      .replace(/\{\{team_name\}\}/g, sample.team_name)
      .replace(/\{\{team_id\}\}/g, sample.team_id)
      .replace(/\{\{member_name\}\}/g, 'Participant')
      .replace(/\{\{status\}\}/g, sample.team_state);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      addToast('Subject and message are required', 'error');
      return;
    }
    setConfirm(true);
  };

  const executeSend = async () => {
    setConfirm(false);
    try {
      setSending(true);
      const response = await apiPost('/emails/send', {
        subject,
        html: body,
        recipients: recipientsPayload,
      });
      setResult(response);
      addToast('Emails sent', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell title="Bulk Emails">
      <section className="panel">
        <div className="panel-header">
          <h3>Email Composer</h3>
          <button className="button secondary" onClick={() => setPreview((v) => !v)}>
            {preview ? 'Hide Preview' : 'Preview'}
          </button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            className="input"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="input"
            rows={8}
            placeholder="Write your email (HTML supported)."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="help-text">
            {'Available placeholders: {{team_name}}, {{team_id}}, {{member_name}}, {{status}}'}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Recipients</h3>
        <div className="detail-grid" style={{ marginTop: 12 }}>
          <div>
            <span className="muted">Target</span>
            <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">All teams</option>
              <option value="status">By status</option>
              <option value="selected">Selected teams</option>
            </select>
          </div>
          <div>
            <span className="muted">Recipients</span>
            <select className="input" value={include} onChange={(e) => setInclude(e.target.value)}>
              <option value="leads">Team Leads Only</option>
              <option value="all">All Members</option>
            </select>
          </div>
          <div>
            <span className="muted">Statuses</span>
            <div style={{ display: 'grid', gap: 6 }}>
              {STATUS_OPTIONS.map((status) => (
                <label key={status.value} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={statuses.includes(status.value)}
                    onChange={(e) => {
                      setStatuses((prev) =>
                        e.target.checked
                          ? [...prev, status.value]
                          : prev.filter((item) => item !== status.value)
                      );
                    }}
                    disabled={target !== 'status'}
                  />
                  {status.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="muted">Team IDs (comma-separated)</span>
            <input
              className="input"
              placeholder="AIW-1234, AIW-5678"
              value={teamIds}
              onChange={(e) => setTeamIds(e.target.value)}
              disabled={target !== 'selected'}
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="button" onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send Emails'}
          </button>
        </div>
      </section>

      {preview && (
        <section className="panel">
          <h3>Preview</h3>
          <div className="preview-box" dangerouslySetInnerHTML={{ __html: renderPreview() }} />
        </section>
      )}

      {result && (
        <section className="panel">
          <h3>Delivery Summary</h3>
          <div className="detail-grid">
            <div><span className="muted">Total</span><strong>{result.total}</strong></div>
            <div><span className="muted">Sent</span><strong>{result.sent}</strong></div>
            <div><span className="muted">Failed</span><strong>{result.failed}</strong></div>
            <div><span className="muted">Warning</span><strong>{result.quota_warning || '—'}</strong></div>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirm}
        title="Send bulk emails"
        description="This will send emails to the selected recipients. Continue?"
        onConfirm={executeSend}
        onCancel={() => setConfirm(false)}
      />
    </AppShell>
  );
}
