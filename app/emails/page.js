"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../../components/AppShell';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { apiPost } from '../../lib/api-client';

const STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered' },
  { value: 'payment_verified', label: 'Payment Verified' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'ready_for_eval', label: 'Ready for Eval' },
  { value: 'project_submitted', label: 'Project Submitted' },
];

const TEMPLATE_OPTIONS = [
  { value: 'aiwars_standard_v1', label: 'Standard AI WARS Template' },
  { value: 'none', label: 'Raw HTML (no header/footer)' },
];

const QUICK_TEMPLATES = [
  {
    id: 'welcome',
    label: 'Welcome',
    subject: 'Welcome to {{event_name}} • {{team_name}}',
    body: `
<p style="margin:0 0 12px 0;">Hi <strong>{{lead_name}}</strong>,</p>
<p style="margin:0 0 12px 0;">Welcome to <strong>{{event_name}}</strong>! Your team <strong>{{team_name}}</strong> ({{team_id}}) is successfully registered.</p>
<p style="margin:0 0 12px 0;">Track: <strong>{{track}}</strong><br/>College: <strong>{{college}}</strong></p>
<p style="margin:0 0 12px 0;">Team members: {{member_names}}</p>
<p style="margin:0;">See you at the venue.</p>
`.trim(),
  },
  {
    id: 'payment',
    label: 'Payment Reminder',
    subject: 'Payment reminder • {{team_name}} ({{team_id}})',
    body: `
<p style="margin:0 0 12px 0;">Hi {{lead_name}},</p>
<p style="margin:0 0 12px 0;">This is a quick reminder to complete payment verification for <strong>{{team_name}}</strong> ({{team_id}}).</p>
<p style="margin:0;">Current status: <strong>{{team_status}}</strong></p>
`.trim(),
  },
  {
    id: 'checkin',
    label: 'Check-in Reminder',
    subject: 'Check-in details • {{team_name}}',
    body: `
<p style="margin:0 0 12px 0;">Hi {{lead_name}},</p>
<p style="margin:0 0 12px 0;">Please bring your team QR code for check-in at <strong>{{event_venue}}</strong> on <strong>{{event_date}}</strong>.</p>
<p style="margin:0;">QR link (fallback): <a href="{{qr_link}}" style="color:#93c5fd;text-decoration:none;">Open QR</a></p>
`.trim(),
  },
  {
    id: 'results',
    label: 'Results Announcement',
    subject: 'Results • {{event_name}}',
    body: `
<p style="margin:0 0 12px 0;">Hi {{lead_name}},</p>
<p style="margin:0 0 12px 0;">Thank you for participating in <strong>{{event_name}}</strong>.</p>
<p style="margin:0;">We’ll share results shortly. Stay tuned!</p>
`.trim(),
  },
];

const DRAFT_KEY = 'aiwars_email_draft_v1';

function csvToList(value) {
  return (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function makeClientId() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function EmailsPage() {
  const { addToast } = useToast();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateId, setTemplateId] = useState('aiwars_standard_v1');
  const [includeQr, setIncludeQr] = useState(false);

  const [target, setTarget] = useState('all');
  const [include, setInclude] = useState('leads');
  const [statuses, setStatuses] = useState([]);
  const [teamIds, setTeamIds] = useState('');
  const [tracks, setTracks] = useState('');
  const [checkedIn, setCheckedIn] = useState('any');
  const [evaluationRounds, setEvaluationRounds] = useState([]);

  const [testEmail, setTestEmail] = useState('');

  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [sendId, setSendId] = useState('');

  const debounceRef = useRef(null);

  const recipientsPayload = useMemo(() => {
    return {
      target,
      team_ids: csvToList(teamIds),
      statuses,
      include,
      tracks: csvToList(tracks),
      checked_in: checkedIn === 'any' ? null : checkedIn === 'yes',
      evaluation_rounds: evaluationRounds,
    };
  }, [target, teamIds, statuses, include, tracks, checkedIn, evaluationRounds]);

  const placeholdersHelp =
    'Team: {{team_name}}, {{team_id}}, {{team_status}}, {{track}}, {{college}} • ' +
    'Member: {{lead_name}}, {{lead_email}}, {{member_names}}, {{member_name}} • ' +
    'Event: {{event_name}}, {{event_date}}, {{event_venue}}, {{current_round}} • ' +
    'QR: {{qr_code}}, {{qr_link}}';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      setSubject(draft.subject || '');
      setBody(draft.body || '');
      setTemplateId(draft.templateId || 'aiwars_standard_v1');
      setIncludeQr(Boolean(draft.includeQr));
      setTarget(draft.target || 'all');
      setInclude(draft.include || 'leads');
      setStatuses(Array.isArray(draft.statuses) ? draft.statuses : []);
      setTeamIds(draft.teamIds || '');
      setTracks(draft.tracks || '');
      setCheckedIn(draft.checkedIn || 'any');
      setEvaluationRounds(Array.isArray(draft.evaluationRounds) ? draft.evaluationRounds : []);
      setTestEmail(draft.testEmail || '');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          subject,
          body,
          templateId,
          includeQr,
          target,
          include,
          statuses,
          teamIds,
          tracks,
          checkedIn,
          evaluationRounds,
          testEmail,
        })
      );
    } catch {
      // ignore
    }
  }, [subject, body, templateId, includeQr, target, include, statuses, teamIds, tracks, checkedIn, evaluationRounds, testEmail]);

  const refreshEstimate = async () => {
    try {
      setEstimating(true);
      const res = await apiPost('/emails/estimate', { recipients: recipientsPayload });
      setEstimate(res);
    } catch {
      setEstimate(null);
    } finally {
      setEstimating(false);
    }
  };

  const refreshPreview = async () => {
    try {
      setPreviewLoading(true);
      const sampleTeamId = recipientsPayload.team_ids?.[0] || null;
      const res = await apiPost('/emails/preview', {
        subject,
        html: body,
        template_id: templateId === 'none' ? null : templateId,
        include_qr: includeQr,
        recipients: recipientsPayload,
        sample_team_id: sampleTeamId,
      });
      setPreviewData(res);
    } catch {
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refreshEstimate();
      refreshPreview();
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, body, templateId, includeQr, recipientsPayload]);

  const applyQuickTemplate = (id) => {
    const item = QUICK_TEMPLATES.find((t) => t.id === id);
    if (!item) return;
    setSubject(item.subject);
    setBody(item.body);
    addToast(`Loaded template: ${item.label}`, 'info');
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      addToast('Subject and message are required', 'error');
      return;
    }
    if (estimate && estimate.total === 0) {
      addToast('No recipients matched the current filters', 'error');
      return;
    }
    setSendId(makeClientId());
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
        template_id: templateId === 'none' ? null : templateId,
        include_qr: includeQr,
        send_id: sendId,
        mode: 'send',
      });
      setResult(response);
      addToast('Emails sent', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const sendTest = async () => {
    if (!testEmail.trim()) {
      addToast('Enter a test email address', 'error');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      addToast('Subject and message are required', 'error');
      return;
    }

    try {
      setSending(true);
      const response = await apiPost('/emails/send', {
        subject,
        html: body,
        recipients: recipientsPayload,
        template_id: templateId === 'none' ? null : templateId,
        include_qr: includeQr,
        mode: 'test',
        test_email: testEmail.trim(),
      });
      setResult(response);
      addToast('Test email sent', 'success');
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="button secondary" onClick={() => setPreviewOpen(true)}>
              Preview
            </button>
            <button className="button secondary" onClick={refreshEstimate} disabled={estimating}>
              {estimating ? 'Estimating…' : 'Estimate'}
            </button>
          </div>
        </div>

        <div className="detail-grid" style={{ marginBottom: 12 }}>
          <div>
            <span className="muted">Template</span>
            <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="muted">Quick templates</span>
            <select className="input" defaultValue="" onChange={(e) => applyQuickTemplate(e.target.value)}>
              <option value="">Select…</option>
              {QUICK_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="muted">QR in email</span>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <input type="checkbox" checked={includeQr} onChange={(e) => setIncludeQr(e.target.checked)} />
              Include team QR code (inline + attachment)
            </label>
          </div>
          <div>
            <span className="muted">Test send</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <button className="button secondary" onClick={sendTest} disabled={sending}>
                Send test
              </button>
            </div>
            <div className="help-text" style={{ marginTop: 8 }}>
              Test sends go only to the address above.
            </div>
          </div>
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
            rows={10}
            placeholder="Write your email body (HTML supported). Header/footer are added automatically with the Standard template."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="help-text">Available placeholders: {placeholdersHelp}</div>
          <div className="help-text">
            Tip: If you enable QR, include <span style={{ color: '#cbd5f5' }}>{'{{qr_code}}'}</span> or{' '}
            <span style={{ color: '#cbd5f5' }}>{'{{qr_link}}'}</span> where you want it — otherwise QR will be appended.
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
              <option value="leads">Team leads only</option>
              <option value="all">All members</option>
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
                        e.target.checked ? [...prev, status.value] : prev.filter((item) => item !== status.value)
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
          <div>
            <span className="muted">Track (comma-separated)</span>
            <input
              className="input"
              placeholder="AI, Web, ML"
              value={tracks}
              onChange={(e) => setTracks(e.target.value)}
            />
          </div>
          <div>
            <span className="muted">Checked-in</span>
            <select className="input" value={checkedIn} onChange={(e) => setCheckedIn(e.target.value)}>
              <option value="any">Any</option>
              <option value="yes">Checked-in only</option>
              <option value="no">Not checked-in</option>
            </select>
          </div>
          <div>
            <span className="muted">Evaluation round (currently in)</span>
            <div style={{ display: 'grid', gap: 6 }}>
              {[1, 2, 3].map((round) => (
                <label key={round} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={evaluationRounds.includes(round)}
                    onChange={(e) => {
                      setEvaluationRounds((prev) =>
                        e.target.checked ? [...prev, round] : prev.filter((r) => r !== round)
                      );
                    }}
                  />
                  Round {round}
                </label>
              ))}
            </div>
            <div className="help-text" style={{ marginTop: 6 }}>
              Filters teams whose <span style={{ color: '#cbd5f5' }}>current evaluation</span> matches the selected round(s).
            </div>
          </div>
        </div>

        <div className="detail-grid" style={{ marginTop: 16 }}>
          <div>
            <span className="muted">Estimated recipients</span>
            <strong>{estimate ? estimate.total : '—'}</strong>
            <div className="help-text" style={{ marginTop: 6 }}>
              {estimate
                ? `Batches: ${estimate.estimated_batches} • Batch size: ${estimate.batch_size} • Sleep: ${estimate.batch_sleep_seconds}s`
                : 'Estimate updates as you edit.'}
            </div>
            {estimate?.quota_warning ? (
              <div className="help-text" style={{ marginTop: 6, color: 'var(--warning)' }}>
                {estimate.quota_warning}
              </div>
            ) : null}
          </div>
          <div>
            <span className="muted">Safety</span>
            <div className="help-text" style={{ marginTop: 6 }}>
              Bulk sends use a campaign ID to prevent accidental resends.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="button" onClick={handleSend} disabled={sending}>
            {sending ? 'Sending…' : 'Send Emails'}
          </button>
        </div>
      </section>

      <div className="sticky-send">
        <button className="button secondary" onClick={() => setPreviewOpen(true)} disabled={sending}>
          Preview
        </button>
        <button className="button" onClick={handleSend} disabled={sending}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>

      {result && (
        <section className="panel">
          <h3>Delivery Summary</h3>
          <div className="detail-grid">
            <div>
              <span className="muted">Total</span>
              <strong>{result.total}</strong>
            </div>
            <div>
              <span className="muted">Sent</span>
              <strong>{result.sent}</strong>
            </div>
            <div>
              <span className="muted">Failed</span>
              <strong>{result.failed}</strong>
            </div>
            <div>
              <span className="muted">Warning</span>
              <strong>{result.quota_warning || '—'}</strong>
            </div>
          </div>
          {result.failed > 0 ? (
            <div className="help-text" style={{ marginTop: 12, color: 'var(--warning)' }}>
              Partial failure detected. Please review audit logs for failed recipients.
            </div>
          ) : null}
        </section>
      )}

      {previewOpen && (
        <div className="modal-backdrop" onClick={() => setPreviewOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(1100px, 95vw)' }}>
            <div className="panel-header" style={{ marginBottom: 10 }}>
              <h3>Live Preview</h3>
              <button className="button secondary" onClick={() => setPreviewOpen(false)}>
                Close
              </button>
            </div>
            <div className="help-text" style={{ marginBottom: 12 }}>
              Preview resolves placeholders server-side using sample data.
            </div>

            <div className="preview-split">
              <div className="preview-frame">
                <div className="preview-title">Desktop</div>
                <div className="preview-body">
                  <iframe
                    className="preview-viewport"
                    style={{ height: 560 }}
                    sandbox=""
                    srcDoc={
                      previewData?.rendered_html ||
                      '<div style="padding:16px;font-family:system-ui">Preview unavailable</div>'
                    }
                    title="Desktop preview"
                  />
                </div>
              </div>
              <div className="preview-frame">
                <div className="preview-title">Mobile (iPhone width)</div>
                <div className="preview-body">
                  <div style={{ padding: 12 }}>
                    <iframe
                      className="preview-viewport mobile"
                      style={{ height: 560 }}
                      sandbox=""
                      srcDoc={
                        previewData?.rendered_html ||
                        '<div style="padding:16px;font-family:system-ui">Preview unavailable</div>'
                      }
                      title="Mobile preview"
                    />
                  </div>
                </div>
              </div>
            </div>

            {previewLoading ? <div className="help-text" style={{ marginTop: 12 }}>Rendering preview…</div> : null}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        title="Send bulk emails"
        description={`This will send emails to approximately ${estimate?.total ?? '—'} recipients. Continue?`}
        onConfirm={executeSend}
        onCancel={() => setConfirm(false)}
      />
    </AppShell>
  );
}
