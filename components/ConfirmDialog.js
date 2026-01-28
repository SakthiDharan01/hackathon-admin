"use client";

export default function ConfirmDialog({ open, title, description, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3 style={{ marginBottom: 8 }}>{title}</h3>
        <p style={{ marginBottom: 20, color: 'var(--muted)' }}>{description}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="button danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
