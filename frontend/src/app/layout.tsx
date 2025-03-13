'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { WebSocketProvider } from '@/providers/WebSocketProvider';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <WebSocketProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
