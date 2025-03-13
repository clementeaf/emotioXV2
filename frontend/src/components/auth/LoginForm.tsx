'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { authAPI } from '@/lib/api';

interface LoginFormState {
  email: string;
  password: string;
  error?: string;
  success?: boolean;
}

interface LoginFormProps {
  className?: string;
}

export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const { updateToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<LoginFormState>({
    email: '',
    password: '',
    error: undefined,
    success: false
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: undefined, success: false }));

    // Validar que los campos no estén vacíos
    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: 'El correo electrónico es obligatorio' }));
      return;
    }

    if (!state.password.trim()) {
      setState(prev => ({ ...prev, error: 'La contraseña es obligatoria' }));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: state.email,
        password: state.password
      });

      if (response.data.token) {
        // Actualizar el token en el AuthProvider
        updateToken(response.data.token);
        setState(prev => ({ ...prev, success: true }));
        
        // Redirigir al dashboard después de mostrar el mensaje de éxito
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setState(prev => ({ ...prev, error: 'Error al iniciar sesión' }));
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.response?.data?.message || 'Error al iniciar sesión'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("max-w-xl mx-auto", className)}>
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900 text-center">
              Iniciar Sesión
            </h1>
            <p className="mt-1 text-sm text-neutral-500 text-center">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </header>

          {state.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-center">
                ¡Inicio de sesión exitoso! Redirigiendo al dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Input
                    type="email"
                    label="Correo electrónico"
                    value={state.email}
                    onChange={e => setState(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="tu@email.com"
                    required
                    error={!!state.error}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    label="Contraseña"
                    value={state.password}
                    onChange={e => setState(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    error={!!state.error}
                    helperText={state.error}
                  />
                </div>
              </div>
              <Button
                type="submit"
                fullWidth
                loading={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 