"use client";

import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';

export default function Topbar({ title, actions, onMenu }) {
  const router = useRouter();
  const { addToast } = useToast();

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      addToast('Logged out', 'info');
      router.push('/login');
    } else {
      addToast('Failed to logout', 'error');
    }
  };

  return (
    <div className="topbar">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          className="icon-button mobile-only"
          type="button"
          onClick={() => (typeof onMenu === 'function' ? onMenu() : null)}
          aria-label="Open menu"
          title="Menu"
        >
          ☰
        </button>
        <div>
          <h2>{title}</h2>
          <p style={{ color: 'var(--muted)' }}>Event control center</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {actions}
        <button className="button secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
