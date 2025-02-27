'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LoginFormState {
  email: string;
  code: string;
  step: 'email' | 'code';
  error?: string;
}

export function LoginForm() {
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

  if (state.step === 'email') {
    return (
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Iniciar Sesión</h2>
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
        <Button
          type="submit"
          fullWidth
          loading={isLoading}
        >
          Solicitar código
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCodeSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Ingresa el código</h2>
      <p className="text-center text-sm text-gray-600">
        Se ha enviado un código de verificación a {state.email}
      </p>
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
} 