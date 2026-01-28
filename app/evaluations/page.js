"use client";

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiGet, apiPost } from '../../lib/api-client';
import usePoll from '../../hooks/usePoll';

export default function EvaluationsPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', duration_minutes: 60, order: 1 });
  const [evaluations, setEvaluations] = useState([]);
  const [activeId, setActiveId] = useState('');

  const loadEvaluations = async () => {
    try {
      const data = await apiGet('/evaluations');
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
      await apiPost('/evaluations/create', form);
      addToast('Evaluation created', 'success');
      setForm({ name: '', duration_minutes: 60, order: 1 });
      loadEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleStart = async () => {
    if (!activeId) return;
    try {
      await apiPost('/evaluations/start', { evaluation_id: activeId });
      addToast('Evaluation started', 'success');
      loadEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleEnd = async () => {
    if (!activeId) return;
    try {
      await apiPost('/evaluations/end', { evaluation_id: activeId });
      addToast('Evaluation ended', 'success');
      loadEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
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
        <div className="panel-header">
          <h3>Manage Evaluations</h3>
          <select className="input" value={activeId} onChange={(e) => setActiveId(e.target.value)} style={{ maxWidth: 240 }}>
            <option value="">Select evaluation</option>
            {evaluations.map((evaluation) => (
              <option key={evaluation.id} value={evaluation.id}>{evaluation.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="button" onClick={handleStart} disabled={!activeId}>Start</button>
          <button className="button danger" onClick={handleEnd} disabled={!activeId}>End</button>
        </div>
      </section>

      <section className="panel">
        <h3>Evaluation List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Duration</th>
              <th>Order</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evaluation) => (
              <tr key={evaluation.id}>
                <td>{evaluation.name}</td>
                <td>{evaluation.duration_minutes} mins</td>
                <td>{evaluation.eval_order}</td>
                <td>{evaluation.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
