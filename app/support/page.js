"use client";

import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { apiGet, apiPatch, apiPost } from '../../lib/api-client';
import usePoll from '../../hooks/usePoll';

function formatTime(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return '';
  }
}

export default function SupportPage() {
  const { addToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationMeta, setConversationMeta] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const [filterUnread, setFilterUnread] = useState(false);
  const [filterStatus, setFilterStatus] = useState(''); // open|resolved
  const [filterTeamId, setFilterTeamId] = useState('');

  const loadConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (filterUnread) params.set('unread', 'true');
      if (filterStatus) params.set('status', filterStatus);
      if (filterTeamId.trim()) params.set('team_id', filterTeamId.trim());

      const qs = params.toString();
      const data = await apiGet(`/admin/chats${qs ? `?${qs}` : ''}`);
      setConversations(data.conversations || []);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const loadConversation = async (teamId) => {
    if (!teamId) return;
    try {
      const data = await apiGet(`/admin/chats/${encodeURIComponent(teamId)}`);
      setMessages(data.messages || []);
      setConversationMeta(data.conversation || null);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  useEffect(() => {
    loadConversations();
  }, [filterUnread, filterStatus, filterTeamId]);

  usePoll(loadConversations, 10000);

  useEffect(() => {
    if (!selectedTeamId) return;
    loadConversation(selectedTeamId);
  }, [selectedTeamId]);

  // Keep the active chat fresh
  usePoll(() => {
    if (!selectedTeamId) return;
    return loadConversation(selectedTeamId);
  }, 5000);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.teamId === selectedTeamId) || null;
  }, [conversations, selectedTeamId]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !selectedTeamId) return;

    try {
      setLoading(true);
      setReply('');
      const data = await apiPost(`/admin/chats/${encodeURIComponent(selectedTeamId)}`, { message: text });
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      await loadConversations();
      await loadConversation(selectedTeamId);
    } catch (err) {
      addToast(err.message, 'error');
      setReply(text);
    } finally {
      setLoading(false);
    }
  };

  const resolveConversation = async (resolved) => {
    if (!selectedTeamId) return;
    try {
      setLoading(true);
      await apiPatch(`/admin/chats/${encodeURIComponent(selectedTeamId)}/resolve`, { resolved });
      addToast(resolved ? 'Marked as resolved' : 'Re-opened', 'success');
      await loadConversations();
      await loadConversation(selectedTeamId);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Support Chat">
      <section className="panel">
        <h3>Inbox</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={filterUnread} onChange={(e) => setFilterUnread(e.target.checked)} />
            Unread only
          </label>
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <input
            className="input"
            placeholder="Filter by Team ID"
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 14, marginTop: 14 }}>
          <div className="panel" style={{ margin: 0 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Conversations</div>
            <div style={{ display: 'grid', gap: 8, maxHeight: 520, overflow: 'auto' }}>
              {conversations.map((c) => {
                const active = c.teamId === selectedTeamId;
                const preview = c.lastMessage?.message || '';
                return (
                  <button
                    key={c.teamId}
                    className={`button ${active ? '' : ''}`}
                    type="button"
                    onClick={() => setSelectedTeamId(c.teamId)}
                    style={{
                      textAlign: 'left',
                      display: 'grid',
                      gap: 4,
                      padding: '10px 12px',
                      opacity: c.status === 'resolved' ? 0.7 : 1,
                      border: active ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.15)',
                      background: active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    }}
                    title={c.unread ? 'Unread' : ''}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontWeight: 700 }}>{c.teamName || c.teamId}</div>
                      <div style={{ opacity: 0.9 }}>{c.unread ? '●' : ''}</div>
                    </div>
                    <div style={{ opacity: 0.85, fontSize: 12 }}>{c.teamId} • {c.teamState || '—'} • {c.status || 'open'}</div>
                    {preview ? <div style={{ opacity: 0.8, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div> : null}
                  </button>
                );
              })}
              {conversations.length === 0 ? (
                <div style={{ opacity: 0.8 }}>No conversations yet.</div>
              ) : null}
            </div>
          </div>

          <div className="panel" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800 }}>Chat</div>
                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  {selectedConversation ? (
                    <>
                      {selectedConversation.teamName || selectedConversation.teamId} ({selectedConversation.teamId})
                    </>
                  ) : (
                    'Select a conversation'
                  )}
                </div>
              </div>
              {selectedTeamId ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="button"
                    onClick={() => resolveConversation(true)}
                    disabled={loading}
                    title="Mark resolved"
                  >
                    Resolve
                  </button>
                  <button
                    className="button danger"
                    onClick={() => resolveConversation(false)}
                    disabled={loading}
                    title="Re-open"
                  >
                    Re-open
                  </button>
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
              {conversationMeta?.status ? `Status: ${conversationMeta.status}` : ''}
            </div>

            <div style={{ marginTop: 12, maxHeight: 460, overflow: 'auto', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 }}>
              {messages.length === 0 ? (
                <div style={{ opacity: 0.8 }}>No messages.</div>
              ) : (
                messages.map((m) => {
                  const role = m.sender_role || m.senderRole;
                  const isTeam = role === 'team';
                  return (
                    <div key={m.id || `${m.created_at}-${m.message}`} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        {isTeam ? 'Team' : 'Support'} • {formatTime(m.created_at)}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <input
                className="input"
                placeholder="Type a reply as Support…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendReply();
                }}
                disabled={!selectedTeamId || loading}
              />
              <button className="button" onClick={sendReply} disabled={!selectedTeamId || loading || !reply.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
