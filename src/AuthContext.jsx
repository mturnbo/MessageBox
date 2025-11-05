import React, { useEffect, createContext, useContext, useState} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem('authToken'));

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('authToken', token);
    } else {
      sessionStorage.removeItem('authToken');
    }
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    sessionStorage.setItem('authToken', newToken);
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ token, handleLoginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);