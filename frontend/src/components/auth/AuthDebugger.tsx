import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface TokenInfo {
  isValid: boolean;
  expiresAt?: Date;
  timeRemaining?: string;
  payload?: any;
}

export function AuthDebugger() {
  const { token, user, logout } = useAuth();
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ isValid: false });
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    const localStorageToken = localStorage.getItem('token');
    const sessionStorageToken = sessionStorage.getItem('token');

    setLocalToken(localStorageToken);
    setSessionToken(sessionStorageToken);

    // Analizar el token
    const tokenToAnalyze = localStorageToken || sessionStorageToken;
    if (tokenToAnalyze) {
      try {
        const parts = tokenToAnalyze.split('.');
        if (parts.length !== 3) {
          setTokenInfo({ isValid: false });
          return;
        }

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        
        // Verificar expiración
        let expiresAt: Date | undefined = undefined;
        let timeRemaining: string | undefined = undefined;
        let isValid = true;
        
        if (payload.exp) {
          expiresAt = new Date(payload.exp * 1000);
          const now = new Date();
          isValid = now < expiresAt;
          
          const diffMs = expiresAt.getTime() - now.getTime();
          const diffMins = Math.round(diffMs / 60000);
          
          if (diffMins <= 0) {
            timeRemaining = `Expirado hace ${Math.abs(diffMins)} minutos`;
          } else {
            timeRemaining = `Expira en ${diffMins} minutos`;
          }
        }

        setTokenInfo({
          isValid,
          expiresAt,
          timeRemaining,
          payload
        });
      } catch (error) {
        console.error('Error analizando token:', error);
        setTokenInfo({ isValid: false });
      }
    } else {
      setTokenInfo({ isValid: false });
    }
  }, [token]);

  const handleFix = () => {
    // Intentar corregir el problema común: token en localStorage pero no en contexto
    if (localToken && !token) {
      window.location.reload();
    } 
    // Token expirado o no existe, redirigir a login
    else {
      // Limpiar almacenamiento para evitar problemas
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Redirigir a login
      window.location.href = '/login';
    }
  };

  const toggleDebugger = () => {
    setShowDebugger(prev => !prev);
  };

  // Solo mostrar el icono de depuración normalmente
  if (!showDebugger) {
    return (
      <button 
        onClick={toggleDebugger}
        className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-50 opacity-70 hover:opacity-100"
        title="Depurador de autenticación"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      </button>
    );
  }

  // Definir clases y mensajes según el estado
  let statusClass = "bg-gray-100 text-gray-800";
  let statusMessage = "Verificando estado de autenticación...";

  if (!localToken && !sessionToken) {
    statusClass = "bg-red-100 text-red-800";
    statusMessage = "No estás autenticado. No se encontró ningún token.";
  } else if (!tokenInfo.isValid) {
    statusClass = "bg-red-100 text-red-800";
    statusMessage = "Token inválido o expirado.";
  } else if (localToken && token) {
    statusClass = "bg-green-100 text-green-800";
    statusMessage = "Autenticación correcta.";
  } else {
    statusClass = "bg-yellow-100 text-yellow-800";
    statusMessage = "Token en storage pero no en contexto de aplicación.";
  }

  return (
    <div className="fixed bottom-0 right-0 p-4 w-full md:w-96 z-50">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center bg-gray-800 text-white px-4 py-2">
          <h3 className="font-medium">Depurador de Autenticación</h3>
          <button onClick={toggleDebugger} className="text-white hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className={`px-4 py-2 ${statusClass} border-l-4 border-current`}>
          <p className="font-medium">{statusMessage}</p>
          {tokenInfo.timeRemaining && <p className="text-sm">{tokenInfo.timeRemaining}</p>}
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Token en localStorage:</span>
              <span className="text-sm">{localToken ? "✅" : "❌"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Token en sessionStorage:</span>
              <span className="text-sm">{sessionToken ? "✅" : "❌"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Token en contexto:</span>
              <span className="text-sm">{token ? "✅" : "❌"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Usuario en contexto:</span>
              <span className="text-sm">{user ? "✅" : "❌"}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleFix}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Reparar autenticación
            </button>
            
            <button
              onClick={logout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 