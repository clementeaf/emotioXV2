'use client';

import Link from 'next/link';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

interface User {
  id: string;
  email: string;
  name: string;
}

interface NavbarProps {
  className?: string;
  researchId?: string;
  mode?: 'dashboard' | 'research';
}

export function Navbar({ className, researchId, mode = 'dashboard' }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className={cn('h-16 bg-white border-b border-neutral-200', className)}>
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {mode === 'research' && researchId && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm">Back to dashboard</span>
              </Link>
              <div className="h-4 w-px bg-neutral-200" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900">Research ID:</span>
                <span className="text-sm text-neutral-500">{researchId}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Help</span>
          </button>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Perfil</span>
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 text-sm text-neutral-700 hover:text-neutral-900 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <span className="text-sm font-medium">
                {(user as User)?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <span>{(user as User)?.name || 'Usuario'}</span>
            <svg
              className={cn(
                'h-4 w-4 transition-transform',
                isMenuOpen ? 'rotate-180' : ''
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-neutral-200">
                <p className="text-sm font-medium text-neutral-900">{(user as User)?.name}</p>
                <p className="text-xs text-neutral-500">{(user as User)?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-50 focus:outline-none"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 