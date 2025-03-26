'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';


interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  error?: string;
  success?: boolean;
}

interface RegisterFormProps {
  className?: string;
}

export function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<RegisterFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    error: undefined,
    success: false
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: undefined, success: false }));

    // Validaciones básicas
    if (!state.name.trim()) {
      setState(prev => ({ ...prev, error: 'El nombre es obligatorio' }));
      return;
    }

    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: 'El correo electrónico es obligatorio' }));
      return;
    }

    if (!state.password.trim()) {
      setState(prev => ({ ...prev, error: 'La contraseña es obligatoria' }));
      return;
    }

    if (state.password !== state.confirmPassword) {
      setState(prev => ({ ...prev, error: 'Las contraseñas no coinciden' }));
      return;
    }

    setIsLoading(true);

    try {
      console.log('Intentando registro con:', { email: state.email, name: state.name });
      const response = await fetch('https://fww0ghfvga.execute-api.us-east-1.amazonaws.com/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          password: state.password
        })
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (response.ok) {
        setState(prev => ({ ...prev, success: true }));
        // Redirigir al login después de un registro exitoso
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.error || 'Error al registrar usuario'
        }));
      }
    } catch (error: any) {
      console.error('Error durante el registro:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Error al registrar usuario. Por favor, intenta nuevamente.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('max-w-xl mx-auto', className)}>
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900 text-center">
              Registro
            </h1>
            <p className="mt-1 text-sm text-neutral-500 text-center">
              Crea una nueva cuenta
            </p>
          </header>

          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-center text-sm">
                {state.error}
              </p>
            </div>
          )}

          {state.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-center">
                ¡Registro exitoso! Redirigiendo al login...
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      label="Nombre"
                      value={state.name}
                      onChange={e => setState(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tu nombre"
                      required
                      error={!!state.error}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      label="Correo electrónico"
                      value={state.email}
                      onChange={e => setState(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@email.com"
                      required
                      error={!!state.error}
                      autoComplete="email"
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
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      label="Confirmar Contraseña"
                      value={state.confirmPassword}
                      onChange={e => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                      error={!!state.error}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  fullWidth
                  loading={isLoading}
                >
                  {isLoading ? 'Registrando...' : 'Registrarse'}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-neutral-600">
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 