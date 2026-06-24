import { getToken } from './authService.js';

let _onTokenRefreshed = null;
let _onAuthFailure = null;

export function init({ onTokenRefreshed, onAuthFailure }) {
  _onTokenRefreshed = onTokenRefreshed;
  _onAuthFailure = onAuthFailure;
}

function buildHeaders(options = {}) {
  const token = getToken();
  const base = { 'Content-Type': 'application/json', ...options.headers };
  if (token) base['Authorization'] = `Bearer ${token}`;
  return base;
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: buildHeaders(options) });

  if (res.status !== 401) return res;

  // Skip refresh for auth endpoints to avoid infinite loops
  if (url.includes('/v1/auth')) return res;

  // Attempt token refresh once
  if (_onTokenRefreshed) {
    try {
      const newToken = await _onTokenRefreshed();
      const retried = await fetch(url, {
        ...options,
        headers: { ...buildHeaders(options), Authorization: `Bearer ${newToken}` },
      });
      return retried;
    } catch {
      _onAuthFailure?.();
      return res;
    }
  }

  _onAuthFailure?.();
  return res;
}
