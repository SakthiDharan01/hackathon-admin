"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Invalid credentials');
      }

      addToast('Welcome back', 'success');
      router.push('/dashboard');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b0e14' }}>
      <form onSubmit={handleSubmit} className="panel" style={{ width: 'min(420px, 90vw)' }}>
        <h2 style={{ marginBottom: 12 }}>Admin Login</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Sign in to control the event.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            className="input"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className="input"
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}
