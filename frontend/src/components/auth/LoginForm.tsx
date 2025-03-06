'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface LoginFormState {
  email: string;
  code: string;
  step: 'email' | 'code';
  error?: string;
}

interface LoginFormProps {
  className?: string;
}

export function LoginForm({ className }: LoginFormProps) {
  const { requestOTP, validateOTP, isLoading } = useAuth();
  const [state, setState] = useState<LoginFormState>({
    email: '',
    code: '',
    step: 'email',
    error: undefined
  });

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: undefined }));

    try {
      await requestOTP(state.email);
      setState(prev => ({ ...prev, step: 'code' }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al solicitar el código'
      }));
    }
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: undefined }));

    try {
      await validateOTP(state.email, state.code);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Código inválido'
      }));
    }
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: 'email', code: '', error: undefined }));
  };

  const renderEmailForm = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
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
            helperText={state.error}
          />
        </div>
      </div>
      <Button
        type="submit"
        fullWidth
        loading={isLoading}
      >
        Solicitar código
      </Button>
    </form>
  );

  const renderCodeForm = () => (
    <form onSubmit={handleCodeSubmit} className="space-y-6">
      <div className="space-y-5">
        <p className="text-center text-sm text-neutral-500">
          Se ha enviado un código de verificación a {state.email}
        </p>
        <div className="space-y-2">
          <Input
            type="text"
            label="Código de verificación"
            value={state.code}
            onChange={e => setState(prev => ({ ...prev, code: e.target.value }))}
            placeholder="123456"
            required
            maxLength={6}
            pattern="\d{6}"
            error={!!state.error}
            helperText={state.error}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          fullWidth
          loading={isLoading}
        >
          Verificar código
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={handleBack}
          disabled={isLoading}
        >
          Volver
        </Button>
      </div>
    </form>
  );

  return (
    <div className={cn("max-w-xl mx-auto", className)}>
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900 text-center">
              {state.step === 'email' ? 'Iniciar Sesión' : 'Ingresa el código'}
            </h1>
            {state.step === 'email' && (
              <p className="mt-1 text-sm text-neutral-500 text-center">
                Ingresa tu correo electrónico para recibir un código de acceso
              </p>
            )}
          </header>

          {state.step === 'email' ? renderEmailForm() : renderCodeForm()}
        </div>
      </div>
    </div>
  );
} 