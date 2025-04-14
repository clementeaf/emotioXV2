'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import API_CONFIG from '@/config/api.config';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

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
  const { login, isLoading: authLoading, error: authError, clearError, isAuthenticated } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [state, setState] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [validation, setValidation] = useState<ValidationState>({
    email: { isValid: true, message: null },
    password: { isValid: true, message: null }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  // Verificar si estamos en modo desarrollo (localhost)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setIsDevMode(hostname === 'localhost' || hostname === '127.0.0.1');
    }
  }, []);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Limpiar errores al montar el componente
  useEffect(() => {
    clearError();
    setFormError(null);
  }, [clearError]);

  // Validar email en tiempo real
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

  // Validar contraseña en tiempo real
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
      clearError();
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

  // Función para usar el usuario de prueba
  const handleUseTestUser = () => {
    setState({
      email: 'clemente@gmail.com',
      password: 'clemente', // Contraseña de prueba
      rememberMe: true
    });
    
    setValidation({
      email: { isValid: true, message: null },
      password: { isValid: true, message: null }
    });
  };

  const handleDevModeLogin = async () => {
    // Solo permitir en entorno de desarrollo local
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      try {
        setStatus('authenticating');
        
        console.log('Iniciando login automático usando API real');
        
        // Usar la ruta proxy
        const loginUrl = `${API_CONFIG.baseURL}/auth/login`;
        console.log('URL de login:', loginUrl);
        
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: 'clemente@gmail.com',
            password: 'clemente',
            rememberMe: state.rememberMe
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error en la respuesta:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          throw new Error('Error en la autenticación');
        }

        const data = await response.json();
        
        if (!data.auth?.auth?.token) {
          console.error('Respuesta sin token:', data);
          throw new Error('Token no recibido del servidor');
        }

        console.log('Login automático exitoso');
        
        // Iniciar sesión con el token real
        await login(data.auth.auth.token, state.rememberMe);
        setStatus('success');
        
        // Redirigir al dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Error en inicio de sesión automático:', error);
        setFormError('Error en inicio de sesión automático');
        setStatus('error');
      }
    } else {
      console.error('El inicio de sesión automático solo está disponible en desarrollo local');
      setFormError('El inicio de sesión automático solo está disponible en desarrollo local');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    setStatus('validating');

    // Validar todos los campos antes de enviar
    const emailValidation = validateEmail(state.email);
    const passwordValidation = validatePassword(state.password);

    setValidation({
      email: emailValidation,
      password: passwordValidation
    });

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setStatus('error');
      setFormError('Por favor, corrige los errores antes de continuar');
      return;
    }

    try {
      setStatus('connecting');
      console.log('Intentando login con:', { email: state.email, rememberMe: state.rememberMe });
      
      setStatus('authenticating');
      
      // Si estamos en modo desarrollo y se solicita login automático, usar el token simulado
      if (isDevMode && state.email === 'clemente@gmail.com' && state.password === 'clemente') {
        console.log('Usando login automático en modo desarrollo');
        await handleDevModeLogin();
        return;
      }
      
      // En cualquier otro caso, usar el login real
      const loginUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth.LOGIN}`;
      console.log('URL de login:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
          rememberMe: state.rememberMe
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Error HTTP ${response.status}: ${response.statusText}` };
        }
        
        setStatus('error');
        setFormError(errorData.message || 'Error al iniciar sesión: Credenciales inválidas');
        return;
      }
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.auth && data.auth.token) {
        setStatus('success');
        await login(data.auth.token, state.rememberMe);
        router.push('/dashboard');
      } else {
        setStatus('error');
        setFormError('La respuesta del servidor no contiene un token válido');
      }
    } catch (error: any) {
      console.error('Error durante el login:', error);
      setStatus('error');
      setFormError('Error al conectar con el servidor. Por favor, intenta nuevamente.');
    }
  };

  const isLoading = status === 'validating' || status === 'connecting' || status === 'authenticating' || authLoading;
  const error = formError || authError;
  const statusMessage = getStatusMessage(status);

  return (
    <div className={cn('max-w-xl mx-auto', className)}>
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-fade-in">
              <p className="text-red-700 text-center text-sm">
                {error}
              </p>
            </div>
          )}

          {statusMessage && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-blue-700 text-center text-sm">
                  {statusMessage}
                </p>
              </div>
            </div>
          )}

          {status === 'success' && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 text-center text-sm">
                  ¡Inicio de sesión exitoso! Redirigiendo...
                </p>
              </div>
            </div>
          )}

          {/* Modo desarrollo - Acceso rápido */}
          {isDevMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col items-center">
                <p className="text-amber-700 text-center text-sm mb-2">
                  <span className="font-semibold">Modo Desarrollo</span> - Acceso rápido con usuario de prueba
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleUseTestUser}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Usar usuario de prueba
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleDevModeLogin}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login automático
                  </Button>
                </div>
                <p className="text-amber-600 text-xs mt-2">
                  Email: clemente@gmail.com | Contraseña: clemente
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Input
                  type="email"
                  label="Correo electrónico"
                  value={state.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="tu@email.com"
                  required
                  error={!validation.email.isValid}
                  disabled={isLoading}
                  autoComplete="username email"
                  helperText={validation.email.message || undefined}
                />
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Contraseña"
                    value={state.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    error={!validation.password.isValid}
                    disabled={isLoading}
                    autoComplete="current-password"
                    helperText={validation.password.message || undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      'absolute right-3 top-9 text-neutral-500 hover:text-neutral-700',
                      isLoading && 'pointer-events-none opacity-50'
                    )}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                  checked={state.rememberMe}
                  onChange={e => handleInputChange('rememberMe', e.target.checked)}
                />
                <span className="ml-2 text-sm text-neutral-600">Recordarme</span>
              </label>

              <Link
                href="/forgot-password"
                className={cn(
                  'text-sm text-blue-600 hover:text-blue-700',
                  isLoading && 'pointer-events-none opacity-50'
                )}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={isLoading || !validation.email.isValid || !validation.password.isValid}
              className="relative"
            >
              <span className={cn(
                'transition-opacity duration-200',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}>
                Iniciar sesión
              </span>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="text-sm">{statusMessage || 'Cargando...'}</span>
                  </div>
                </div>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-neutral-600">
                ¿No tienes una cuenta?{' '}
                <Link 
                  href="/register" 
                  className={cn(
                    'text-blue-600 hover:text-blue-700 font-medium',
                    isLoading && 'pointer-events-none opacity-50'
                  )}
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 