const TOKEN_KEY = 'mb_token';
const USER_KEY = 'mb_user';
const REFRESH_TOKEN_KEY = 'mb_refresh_token';

export async function login(credentials) {
  const res = await fetch('/v1/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message || 'Login failed'), { status: res.status });
  }
  return res.json();
}

export async function refreshToken() {
  const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!storedRefresh) throw new Error('No refresh token stored');
  const res = await fetch('/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: storedRefresh }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

export function storeSession(loginResponse) {
  const user = {
    username: loginResponse.username,
    token: loginResponse.token,
    refreshToken: loginResponse.refreshToken ?? null,
  };
  localStorage.setItem(TOKEN_KEY, loginResponse.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (loginResponse.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, loginResponse.refreshToken);
  }
  return user;
}

export function updateToken(newToken) {
  localStorage.setItem(TOKEN_KEY, newToken);
  const raw = localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      const user = JSON.parse(raw);
      localStorage.setItem(USER_KEY, JSON.stringify({ ...user, token: newToken }));
    } catch {
      // ignore corrupt stored user
    }
  }
}

export function loadStoredSession() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
