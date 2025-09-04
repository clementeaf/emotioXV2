'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface AdminContextType {
  isAuthenticated: boolean;
  login: (secretKey: string) => boolean;
  logout: () => void;
  checkAuth: () => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already authenticated (from sessionStorage)
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (secretKey: string): boolean => {
    if (secretKey === 'admin2025!') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      
      // Set admin token for API calls
      const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRldi1hZG1pbi1pZCIsImVtYWlsIjoiZGV2QGxvY2FsaG9zdCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcyNTQxNzQ1NSwiZXhwIjoxNzI1NTAzODU1fQ.JNbQfqjhfvUCWR7S7lGpKu2vU3fzFRD6rJHm8cQQ_hg';
      localStorage.setItem('token', adminToken);
      
      toast.success('Acceso autorizado');
      return true;
    } else {
      toast.error('Clave secreta incorrecta');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('token');
    toast.success('Sesión cerrada');
  };

  const checkAuth = (): boolean => {
    return isAuthenticated;
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    checkAuth
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};