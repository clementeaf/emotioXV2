'use client';

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
  mode?: 'research' | 'default';
}

export function Navbar({ className }: NavbarProps) {
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
    <div className={cn('fixed top-4 right-4 z-50', className)}>
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 focus:outline-none px-3 py-1.5"
        >
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
            <span className="text-sm font-medium">
              {(user as User)?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm">{(user as User)?.name || 'Usuario'}</span>
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
          <div className="absolute right-0 mt-2 py-1">
            <div className="px-4 py-2">
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
  );
} 