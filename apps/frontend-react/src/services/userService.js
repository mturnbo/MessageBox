import { apiFetch } from './api.js';

export async function getUsers(limit = 50, page = 1) {
  const res = await apiFetch(`/v1/users/${limit}/${page}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getUser(id) {
  const res = await apiFetch(`/v1/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}
