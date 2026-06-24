import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from './services/authService.js';
import * as api from './services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.loadStoredSession());

  const isLoggedIn = user !== null;
  const token = user?.token ?? null;

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    // Store token first so apiFetch can immediately use it for the user lookup
    const stored = authService.storeSession(response);
    setUser(stored);

    // Resolve the numeric userId in the background — required for inbox/sent queries
    api.apiFetch(`/v1/users/${response.username}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((userData) => {
        if (!userData?.id) return;
        authService.updateUserId(userData.id);
        setUser((prev) => (prev ? { ...prev, userId: userData.id } : null));
      })
      .catch(() => { /* userId remains null; non-critical */ });

    return stored;
  };

  const logout = () => {
    authService.clearSession();
    setUser(null);
  };

  const refreshAccessToken = async () => {
    const response = await authService.refreshToken();
    authService.updateToken(response.token);
    setUser((prev) => (prev ? { ...prev, token: response.token } : null));
    return response.token;
  };

  useEffect(() => {
    api.init({
      onTokenRefreshed: refreshAccessToken,
      onAuthFailure: logout,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, token, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
