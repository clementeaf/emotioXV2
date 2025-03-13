'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  token: string | null;
  updateToken: (newToken: string) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  updateToken: () => {},
  clearToken: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    // Intentar recuperar el token del localStorage al iniciar
    return localStorage.getItem('auth_token');
  });

  const updateToken = useCallback((newToken: string) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
  }, []);

  const clearToken = useCallback(() => {
    setToken(null);
    localStorage.removeItem('auth_token');
  }, []);

  return (
    <AuthContext.Provider value={{ token, updateToken, clearToken }}>
      {children}
    </AuthContext.Provider>
  );
}; 