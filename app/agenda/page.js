"use client";

import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api-client';
import usePoll from '../../hooks/usePoll';

export default function AgendaPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState({ title: '', detail: '', sort_order: 0, hidden: false });
  const [editingId, setEditingId] = useState('');
  const [editDraft, setEditDraft] = useState({ title: '', detail: '', sort_order: 0, hidden: false });

  const loadAgenda = async () => {
    try {
      const data = await apiGet('/admin/agenda');
      setItems(data.agenda || []);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  usePoll(loadAgenda, 15000);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft({
      title: item.title || '',
      detail: item.detail || '',
      sort_order: Number(item.sortOrder || 0),
      hidden: !!item.hidden,
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditDraft({ title: '', detail: '', sort_order: 0, hidden: false });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setLoading(true);
      await apiPatch(`/admin/agenda/${editingId}`, {
        title: editDraft.title,
        detail: editDraft.detail,
        hidden: !!editDraft.hidden,
        sort_order: Number(editDraft.sort_order),
      });
      addToast('Agenda item updated', 'success');
      cancelEdit();
      await loadAgenda();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createCustom = async () => {
    try {
      if (!creating.title.trim()) {
        addToast('Title is required', 'error');
        return;
      }
      setLoading(true);
      await apiPost('/admin/agenda', {
        title: creating.title,
        detail: creating.detail || null,
        hidden: !!creating.hidden,
        sort_order: Number(creating.sort_order),
      });
      addToast('Custom agenda item added', 'success');
      setCreating({ title: '', detail: '', sort_order: 0, hidden: false });
      await loadAgenda();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustom = async (id) => {
    const ok = window.confirm('Delete this custom agenda item? This cannot be undone.');
    if (!ok) return;
    try {
      setLoading(true);
      await apiDelete(`/admin/agenda/${id}`);
      addToast('Agenda item deleted', 'success');
      await loadAgenda();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [items]);

  return (
    <AppShell title="Agenda">
      <section className="panel">
        <h3>Add Custom Agenda Item</h3>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Title (e.g., Lunch Break)"
            value={creating.title}
            onChange={(e) => setCreating((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            className="input"
            rows={3}
            placeholder="Details (optional)"
            value={creating.detail}
            onChange={(e) => setCreating((p) => ({ ...p, detail: e.target.value }))}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="input"
              style={{ maxWidth: 200 }}
              type="number"
              placeholder="Sort order"
              value={creating.sort_order}
              onChange={(e) => setCreating((p) => ({ ...p, sort_order: Number(e.target.value) }))}
            />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={creating.hidden}
                onChange={(e) => setCreating((p) => ({ ...p, hidden: e.target.checked }))}
              />
              Hidden
            </label>
          </div>
          <button className="button" onClick={createCustom} disabled={loading}>
            {loading ? 'Working…' : 'Add'}
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>Manage Agenda</h3>
        <p style={{ opacity: 0.8, marginTop: 6 }}>
          Evaluations are auto-linked. You can override label, hide rounds, and adjust ordering. Custom items can be deleted.
        </p>

        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Title / Detail</th>
              <th>Order</th>
              <th>Status</th>
              <th style={{ width: 260 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => {
              const isEditing = editingId === item.id;
              const isCustom = item.type === 'custom';
              return (
                <tr key={item.id} style={{ opacity: item.hidden ? 0.6 : 1 }}>
                  <td>{item.type}</td>
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
                          rows={2}
                          value={editDraft.detail}
                          onChange={(e) => setEditDraft((p) => ({ ...p, detail: e.target.value }))}
                        />
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={editDraft.hidden}
                            onChange={(e) => setEditDraft((p) => ({ ...p, hidden: e.target.checked }))}
                          />
                          Hidden
                        </label>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.title}</div>
                        {item.detail ? (
                          <div style={{ opacity: 0.85, marginTop: 6, whiteSpace: 'pre-wrap' }}>{item.detail}</div>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="input"
                        type="number"
                        value={editDraft.sort_order}
                        onChange={(e) => setEditDraft((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                        style={{ maxWidth: 140 }}
                      />
                    ) : (
                      item.sortOrder
                    )}
                  </td>
                  <td>{item.status || '—'}</td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="button" onClick={saveEdit} disabled={loading}>Save</button>
                        <button className="button danger" onClick={cancelEdit} disabled={loading}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="button" onClick={() => startEdit(item)} disabled={loading}>Edit</button>
                        <button
                          className="button danger"
                          onClick={() => deleteCustom(item.id)}
                          disabled={loading || !isCustom}
                          title={!isCustom ? 'Evaluation-linked items cannot be deleted (hide instead)' : 'Delete'}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ opacity: 0.8 }}>No agenda items.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
