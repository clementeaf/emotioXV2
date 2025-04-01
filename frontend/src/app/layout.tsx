'use client';

import { useEffect, useState } from 'react';

import './globals.css';
import { Toaster } from 'react-hot-toast';

import { DevModeInfo } from '@/components/common/DevModeInfo';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ResearchProvider } from '@/providers/ResearchProvider';
import { ErrorLogProvider, LogViewer } from '@/components/utils/ErrorLogger';
import { apiClient } from '@/config/api-client';

// Importar utilidades de debugging - solo se cargan en el cliente
import '@/utils/debugging';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Estado para el entorno
  const [isDevelopment, setIsDevelopment] = useState(false);
  
  // Inicializar verificación de entorno
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Verificar si estamos en desarrollo
      const isDevEnv = process.env.NODE_ENV === 'development';
      setIsDevelopment(isDevEnv);
      
      // Activar automáticamente el debugger en desarrollo
      if (isDevEnv && typeof window.enableApiDebugger === 'function') {
        console.log('🔍 [DEBUG] Activando debugger de API automáticamente en entorno de desarrollo');
        window.enableApiDebugger();
      }
      
      // Asegurar que el token se establezca en apiClient al iniciar
      const initializeApiAuth = () => {
        try {
          const storageType = localStorage.getItem('auth_storage_type') || 'local';
          const token = storageType === 'local'
            ? localStorage.getItem('token')
            : sessionStorage.getItem('token');
            
          if (token) {
            console.log('🔑 [AUTH] Estableciendo token en apiClient al iniciar aplicación');
            apiClient.setAuthToken(token);
          } else {
            console.log('🔑 [AUTH] No se encontró token al iniciar la aplicación');
          }
        } catch (error) {
          console.error('🔑 [AUTH] Error al inicializar el token en apiClient:', error);
        }
      };
      
      initializeApiAuth();
    }
  }, []);

  return (
    <html lang="es">
      <body className="font-sans">
        <QueryProvider>
          <AuthProvider>
            <ResearchProvider>
              <ErrorLogProvider>
                {children}
                <Toaster position="top-right" />
                <DevModeInfo variant="floating" />
                <LogViewer />
              </ErrorLogProvider>
            </ResearchProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
