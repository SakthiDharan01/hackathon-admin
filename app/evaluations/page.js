"use client";

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api-client';
import usePoll from '../../hooks/usePoll';

export default function EvaluationsPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', duration_minutes: 60, order: 1 });
  const [evaluations, setEvaluations] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [editingStatus, setEditingStatus] = useState('');
  const [editDraft, setEditDraft] = useState({ name: '', duration_minutes: 60, order: 1 });
  const [busyId, setBusyId] = useState('');

  const loadEvaluations = async () => {
    try {
      const data = await apiGet('/admin/evaluations');
      setEvaluations(data.evaluations || []);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, []);

  usePoll(loadEvaluations, 15000);

  const handleCreate = async () => {
    try {
      if (!form.name.trim()) {
        addToast('Name is required', 'error');
        return;
      }
      await apiPost('/admin/evaluations', form);
      addToast('Evaluation created', 'success');
      setForm({ name: '', duration_minutes: 60, order: 1 });
      loadEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setEditingStatus(ev.status || '');
    setEditDraft({
      name: ev.name || '',
      duration_minutes: Number(ev.duration_minutes || 0),
      order: Number(ev.eval_order || 0),
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditingStatus('');
    setEditDraft({ name: '', duration_minutes: 60, order: 1 });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setBusyId(editingId);
      const status = editingStatus;
      const payload = { name: editDraft.name };
      if (status === 'pending') {
        payload.duration_minutes = Number(editDraft.duration_minutes);
        payload.order = Number(editDraft.order);
      } else if (status === 'completed') {
        payload.duration_minutes = Number(editDraft.duration_minutes);
      }

      await apiPatch(`/admin/evaluations/${editingId}`, payload);
      addToast('Evaluation updated', 'success');
      cancelEdit();
      await loadEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const deleteEval = async (id) => {
    const ok = window.confirm('Delete this evaluation? Pending or completed evaluations can be deleted. Live evaluations cannot be deleted.');
    if (!ok) return;
    try {
      setBusyId(id);
      await apiDelete(`/admin/evaluations/${id}`);
      addToast('Evaluation deleted', 'success');
      await loadEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const startEval = async (id) => {
    try {
      setBusyId(id);
      await apiPost(`/admin/evaluations/${id}/start`);
      addToast('Evaluation started', 'success');
      await loadEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const endEval = async (id) => {
    try {
      setBusyId(id);
      await apiPost(`/admin/evaluations/${id}/end`);
      addToast('Evaluation ended', 'success');
      await loadEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  return (
    <AppShell title="Evaluations">
      <section className="panel">
        <h3>Create Evaluation</h3>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input className="input" type="number" placeholder="Duration (minutes)" value={form.duration_minutes} onChange={(e) => setForm((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))} />
          <input className="input" type="number" placeholder="Order" value={form.order} onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))} />
          <button className="button" onClick={handleCreate}>Create</button>
        </div>
      </section>

      <section className="panel">
        <h3>Evaluation List</h3>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Duration</th>
              <th>Order</th>
              <th>Status</th>
              <th style={{ width: 260 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evaluation) => {
              const isEditing = editingId === evaluation.id;
              const isPending = evaluation.status === 'pending';
              const isLive = evaluation.status === 'live';
              const isCompleted = evaluation.status === 'completed';
              const isBusy = busyId === evaluation.id;

              // Backend enforces these rules; UI mirrors them.
              const canEdit = true;
              const canEditDuration = isPending || isCompleted;
              const canEditOrder = isPending;
              const canDelete = isPending || isCompleted;
              const canStart = isPending;
              const canEnd = isLive;

              return (
                <tr key={evaluation.id}>
                  <td>
                    {isEditing ? (
                      <input
                        className="input"
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                      />
                    ) : (
                      evaluation.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="input"
                        type="number"
                        value={editDraft.duration_minutes}
                        disabled={!canEditDuration}
                        onChange={(e) => setEditDraft((p) => ({ ...p, duration_minutes: Number(e.target.value) }))}
                      />
                    ) : (
                      `${evaluation.duration_minutes} mins`
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="input"
                        type="number"
                        value={editDraft.order}
                        disabled={!canEditOrder}
                        onChange={(e) => setEditDraft((p) => ({ ...p, order: Number(e.target.value) }))}
                      />
                    ) : (
                      evaluation.eval_order
                    )}
                  </td>
                  <td>
                    {isLive ? 'LIVE' : isCompleted ? 'Completed' : 'Pending'}
                  </td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="button" onClick={saveEdit} disabled={!canEdit || isBusy}>Save</button>
                        <button className="button danger" onClick={cancelEdit} disabled={isBusy}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="button" onClick={() => startEdit(evaluation)} disabled={!canEdit || isBusy}>Edit</button>
                        <button className="button danger" onClick={() => deleteEval(evaluation.id)} disabled={!canDelete || isBusy}>Delete</button>
                        <button className="button" onClick={() => startEval(evaluation.id)} disabled={!canStart || isBusy}>Start</button>
                        <button className="button danger" onClick={() => endEval(evaluation.id)} disabled={!canEnd || isBusy}>End</button>
                      </div>
                    )}

                    {evaluation.status === 'live' ? (
                      <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                        While LIVE: duration and order are locked.
                      </div>
                    ) : null}

                    {evaluation.status === 'completed' ? (
                      <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                        Completed: you can still rename and adjust duration (order stays locked).
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {evaluations.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ opacity: 0.8 }}>No evaluations yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
