"use client";

import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api-client';
import usePoll from '../../hooks/usePoll';

export default function AnnouncementsPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ title: '', body: '', priority: false, scope: 'public', team_ids: '' });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editDraft, setEditDraft] = useState({ title: '', body: '', priority: false, scope: 'public', team_id: '' });

  const loadAnnouncements = async () => {
    try {
      const data = await apiGet('/admin/announcements');
      setAnnouncements(data.announcements || []);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  usePoll(loadAnnouncements, 15000);

  const parsedTeamIds = useMemo(() => {
    if (!form.team_ids) return [];
    return form.team_ids
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }, [form.team_ids]);

  const handleSubmit = async () => {
    try {
      if (!form.title.trim() || !form.body.trim()) {
        addToast('Title and message are required', 'error');
        return;
      }

      setLoading(true);
      const scope = form.scope;
      if (scope === 'team' && parsedTeamIds.length === 0) {
        addToast('Enter one or more Team IDs (comma-separated)', 'error');
        return;
      }

      await apiPost('/admin/announcements', {
        title: form.title,
        body: form.body,
        priority: !!form.priority,
        scope,
        team_ids: scope === 'team' ? parsedTeamIds : undefined,
      });

      addToast('Announcement published', 'success');
      setForm({ title: '', body: '', priority: false, scope: 'public', team_ids: '' });
      await loadAnnouncements();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft({
      title: item.title || '',
      body: item.body || '',
      priority: !!item.priority,
      scope: item.scope || 'public',
      team_id: item.team_id || '',
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditDraft({ title: '', body: '', priority: false, scope: 'public', team_id: '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      if (!editDraft.title.trim() || !editDraft.body.trim()) {
        addToast('Title and message are required', 'error');
        return;
      }
      if (editDraft.scope === 'team' && !editDraft.team_id.trim()) {
        addToast('Team ID is required for team announcements', 'error');
        return;
      }

      setLoading(true);
      await apiPatch(`/admin/announcements/${editingId}`, {
        title: editDraft.title,
        body: editDraft.body,
        priority: !!editDraft.priority,
        scope: editDraft.scope,
        team_id: editDraft.scope === 'team' ? editDraft.team_id.trim() : null,
      });
      addToast('Announcement updated', 'success');
      cancelEdit();
      await loadAnnouncements();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    const ok = window.confirm('Delete this announcement? This cannot be undone.');
    if (!ok) return;
    try {
      setLoading(true);
      await apiDelete(`/admin/announcements/${id}`);
      addToast('Announcement deleted', 'success');
      await loadAnnouncements();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Announcements">
      <section className="panel">
        <h3>Create Announcement</h3>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <select
            className="input"
            value={form.scope}
            onChange={(e) => setForm((prev) => ({ ...prev, scope: e.target.value }))}
          >
            <option value="public">Public (all teams)</option>
            <option value="team">Specific team(s)</option>
          </select>
          {form.scope === 'team' ? (
            <input
              className="input"
              placeholder="Target Team IDs (comma-separated, e.g., AIW-001, AIW-002)"
              value={form.team_ids}
              onChange={(e) => setForm((prev) => ({ ...prev, team_ids: e.target.value }))}
            />
          ) : null}
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="input"
            rows={3}
            placeholder="Message (plain text; participants will see it as-is)"
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.checked }))}
            />
            System (⚠️)
          </label>
          <button className="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Working…' : 'Publish'}
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>Manage Announcements</h3>

        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Target</th>
              <th>Type</th>
              <th>Created</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => {
              const isEditing = editingId === a.id;
              const target = a.scope === 'team' ? `Team: ${a.team_id || '—'}` : 'Public';
              const type = a.priority ? 'System' : 'Normal';
              return (
                <tr key={a.id}>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        <input
                          className="input"
                          value={editDraft.title}
                          onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))}
                        />
                        <textarea
                          className="input"
                          rows={3}
                          value={editDraft.body}
                          onChange={(e) => setEditDraft((p) => ({ ...p, body: e.target.value }))}
                        />

                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            className="input"
                            value={editDraft.scope}
                            onChange={(e) => setEditDraft((p) => ({ ...p, scope: e.target.value }))}
                            style={{ maxWidth: 180 }}
                          >
                            <option value="public">Public</option>
                            <option value="team">Team</option>
                          </select>
                          {editDraft.scope === 'team' ? (
                            <input
                              className="input"
                              placeholder="Team ID"
                              value={editDraft.team_id}
                              onChange={(e) => setEditDraft((p) => ({ ...p, team_id: e.target.value }))}
                              style={{ maxWidth: 220 }}
                            />
                          ) : null}
                          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              checked={editDraft.priority}
                              onChange={(e) => setEditDraft((p) => ({ ...p, priority: e.target.checked }))}
                            />
                            System (⚠️)
                          </label>
                        </div>

                        <div style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>
                            Preview {editDraft.priority ? '⚠️' : 'ℹ️'}
                          </div>
                          <div style={{ fontWeight: 600 }}>{editDraft.title || 'Announcement'}</div>
                          <div style={{ opacity: 0.9, marginTop: 4, whiteSpace: 'pre-wrap' }}>{editDraft.body || ''}</div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 700 }}>{a.title}</div>
                        <div style={{ opacity: 0.85, marginTop: 6, whiteSpace: 'pre-wrap' }}>{a.body}</div>
                      </div>
                    )}
                  </td>
                  <td>{isEditing ? (editDraft.scope === 'team' ? `Team: ${editDraft.team_id || '—'}` : 'Public') : target}</td>
                  <td>{type}</td>
                  <td>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="button" onClick={saveEdit} disabled={loading}>Save</button>
                        <button className="button danger" onClick={cancelEdit} disabled={loading}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="button" onClick={() => startEdit(a)} disabled={loading}>Edit</button>
                        <button className="button danger" onClick={() => deleteAnnouncement(a.id)} disabled={loading}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {announcements.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ opacity: 0.8 }}>No announcements yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
