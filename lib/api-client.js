export async function apiGet(path) {
  const res = await fetch(`/api/admin${path}`, { method: 'GET' });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`/api/admin${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPatch(path, body) {
  const res = await fetch(`/api/admin${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`/api/admin${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  // Some deletes return empty response bodies; tolerate that.
  const text = await res.text();
  if (!text) return { status: 'deleted' };
  try {
    return JSON.parse(text);
  } catch {
    return { status: 'deleted', raw: text };
  }
}
