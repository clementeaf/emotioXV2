'use client';

import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';

import './globals.css';
import { Toaster } from 'react-hot-toast';

import { DevModeInfo } from '@/components/common/DevModeInfo';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ResearchProvider } from '@/providers/ResearchProvider';
import { ErrorLogProvider, LogViewer } from '@/components/utils/ErrorLogger';

const inter = Inter({ subsets: ['latin'] });

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
    }
  }, []);

  return (
    <html lang="es">
      <body className={inter.className}>
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
