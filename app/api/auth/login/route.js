import { NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function POST(request) {
  const body = await request.json();

  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await res.text();
    return new NextResponse(message || 'Invalid credentials', { status: res.status });
  }

  const data = await res.json();
  const token = data.token;

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return response;
}
