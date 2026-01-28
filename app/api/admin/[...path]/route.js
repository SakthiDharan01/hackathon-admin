import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

async function forward(request, method) {
  const token = cookies().get('admin_token');
  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { pathname, search } = new URL(request.url);
  const path = pathname.replace('/api/admin', '');

  const headers = {
    Authorization: `Bearer ${token.value}`,
  };

  let body;
  if (method !== 'GET' && method !== 'HEAD') {
    const raw = await request.text();
    if (raw) {
      headers['Content-Type'] = 'application/json';
      body = raw;
    }
  }

  const res = await fetch(`${API_BASE}${path}${search}`, {
    method,
    headers,
    body,
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') || 'application/json';
  return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
}

export async function GET(request) {
  return forward(request, 'GET');
}

export async function POST(request) {
  return forward(request, 'POST');
}

export async function PATCH(request) {
  return forward(request, 'PATCH');
}

export async function PUT(request) {
  return forward(request, 'PUT');
}

export async function DELETE(request) {
  return forward(request, 'DELETE');
}
