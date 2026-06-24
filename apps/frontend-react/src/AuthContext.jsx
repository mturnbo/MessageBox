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
    const stored = authService.storeSession(response);
    setUser(stored);
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

  // Wire the API layer so apiFetch can refresh tokens and trigger logout
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
