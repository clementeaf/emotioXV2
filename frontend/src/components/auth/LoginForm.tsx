'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { authAPI } from '@/lib/api'; // Importar la API configurada con Alova
import { PUBLIC_ROUTES, DASHBOARD_ROUTES } from '@/routes'; // Importar rutas centralizadas

interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationState {
  email: {
    isValid: boolean;
    message: string | null;
  };
  password: {
    isValid: boolean;
    message: string | null;
  };
}

interface LoginFormProps {
  className?: string;
}

type LoginStatus = 'idle' | 'validating' | 'connecting' | 'authenticating' | 'success' | 'error';

export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const { login, authLoading, authError } = useAuth();
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  
  const [state, setState] = useState<LoginFormState>({
    email: 'clemente@gmail.com',
    password: 'clemente',
    rememberMe: true
  });
  
  const [validation, setValidation] = useState<ValidationState>({
    email: { isValid: true, message: null },
    password: { isValid: true, message: null }
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, message: 'El correo electrónico es obligatorio' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Ingresa un correo electrónico válido' };
    }
    return { isValid: true, message: null };
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return { isValid: false, message: 'La contraseña es obligatoria' };
    }
    if (password.length < 6) {
      return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }
    return { isValid: true, message: null };
  };

  const getStatusMessage = (status: LoginStatus) => {
    switch (status) {
      case 'validating':
        return 'Validando datos...';
      case 'connecting':
        return 'Conectando con el servidor...';
      case 'authenticating':
        return 'Autenticando...';
      case 'success':
        return '¡Inicio de sesión exitoso! Redirigiendo...';
      default:
        return null;
    }
  };

  const handleInputChange = (field: keyof LoginFormState, value: string | boolean) => {
    setState(prev => ({ ...prev, [field]: value }));
    
    if (status === 'error') {
      setStatus('idle');
      setFormError(null);
    }

    // Validar en tiempo real
    if (field === 'email') {
      setValidation(prev => ({
        ...prev,
        email: validateEmail(value as string)
      }));
    } else if (field === 'password') {
      setValidation(prev => ({
        ...prev,
        password: validatePassword(value as string)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('validating');
    setFormError(null);
    
    try {
      console.log('Iniciando proceso de login...');
      
      // Usar authAPI que ya tiene la configuración correcta
      const response = await authAPI.login({ 
        email: state.email, 
        password: state.password 
      }).catch(error => {
        // Verificar si es un error de servidor
        if (error.message && error.message.includes('502')) {
          throw new Error('Error 502: El servidor está caído. Por favor contacta al administrador.');
        }
        throw error;
      });
      
      console.log('Respuesta del servidor:', response);
      
      // La respuesta ya viene procesada por Alova
      const data = response.data;
      const token = data.token || (data.auth && data.auth.token);
      
      if (token) {
        console.log('Token recibido, procediendo con login...');
        await login(token, state.rememberMe);
        setStatus('success');
        console.log('Login exitoso');
        // Usar ruta centralizada para redirección
        router.push(DASHBOARD_ROUTES.DASHBOARD);
      } else {
        console.error('Respuesta sin token:', data);
        throw new Error('Token no recibido en el formato esperado');
      }
    } catch (err) {
      console.error('Error durante el proceso de login:', err);
      setStatus('error');
      setFormError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  const isLoading = status === 'validating' || status === 'connecting' || status === 'authenticating' || authLoading;
  const error = formError || authError;
  const statusMessage = getStatusMessage(status);

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md mx-auto my-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Iniciar Sesión</h1>
        <p className="text-neutral-600 mt-2">Ingresa tus credenciales para acceder a tu cuenta</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-fade-in">
          <p className="text-red-700 text-center text-sm">
            {error}
          </p>
        </div>
      )}

      {status === 'success' && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <p className="text-green-700 text-center text-sm">
              ¡Inicio de sesión exitoso! Redirigiendo...
            </p>
          </div>
        </div>
      )}

      {statusMessage && !error && status !== 'success' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-blue-700 text-center text-sm">
              {statusMessage}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={state.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={state.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={state.rememberMe}
              onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-neutral-700">
              Recordarme
            </label>
          </div>
          <Link 
            href={PUBLIC_ROUTES.FORGOT_PASSWORD} 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </div>
          ) : (
            'Iniciar sesión'
          )}
        </button>

        <div className="text-center mt-4">
          <span className="text-sm text-neutral-600">¿No tienes una cuenta? </span>
          <Link 
            href={PUBLIC_ROUTES.REGISTER} 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Regístrate aquí
          </Link>
        </div>
      </form>
    </div>
  );
} 