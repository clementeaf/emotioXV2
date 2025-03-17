'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ResearchProvider } from '@/providers/ResearchProvider';
import { Toaster } from 'react-hot-toast';
import { DevModeInfo } from '@/components/common/DevModeInfo';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <ResearchProvider>
              {children}
              <Toaster position="top-right" />
              <DevModeInfo variant="floating" />
            </ResearchProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
