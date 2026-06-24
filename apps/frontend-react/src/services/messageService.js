import { apiFetch } from './api.js';

export async function getInbox(recipientId, page = 1, limit = 10) {
  const res = await apiFetch(`/v1/messages/inbox?recipientId=${recipientId}&page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch inbox');
  return res.json();
}

export async function getSent(senderId, page = 1, limit = 10) {
  const res = await apiFetch(`/v1/messages/sent?senderId=${senderId}&page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch sent messages');
  return res.json();
}

export async function getMessage(id) {
  const res = await apiFetch(`/v1/messages/${id}`);
  if (!res.ok) throw new Error('Failed to fetch message');
  return res.json();
}

export async function markAsRead(id) {
  const res = await apiFetch('/v1/messages/read', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to mark message as read');
  return res.json();
}

export async function archiveMessage(id, deletedBy) {
  const res = await apiFetch('/v1/messages/delete', {
    method: 'POST',
    body: JSON.stringify({ id, deletedBy }),
  });
  if (!res.ok) throw new Error('Failed to archive message');
  return res.json();
}

export async function createMessage(payload) {
  const res = await apiFetch('/v1/messages/post', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}
