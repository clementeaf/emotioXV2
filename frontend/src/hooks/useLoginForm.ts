import { authAPI } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { DASHBOARD_ROUTES } from '@/routes';
import { validateEmail, validatePassword } from '@/utils/auth-validation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationState {
  email: { isValid: boolean; message: string | null };
  password: { isValid: boolean; message: string | null };
}

type LoginStatus = 'idle' | 'validating' | 'connecting' | 'authenticating' | 'success' | 'error';

export const useLoginForm = () => {
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

  const getStatusMessage = (status: LoginStatus) => {
    switch (status) {
      case 'validating': return 'Validando datos...';
      case 'connecting': return 'Conectando con el servidor...';
      case 'authenticating': return 'Autenticando...';
      case 'success': return '¡Inicio de sesión exitoso! Redirigiendo...';
      default: return null;
    }
  };

  const handleInputChange = (field: keyof LoginFormState, value: string | boolean) => {
    setState(prev => ({ ...prev, [field]: value }));

    if (status === 'error') {
      setStatus('idle');
      setFormError(null);
    }

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
      const response = await authAPI.login({
        email: state.email,
        password: state.password
      }).catch(error => {
        if (error.message && error.message.includes('502')) {
          throw new Error('Error 502: El servidor está caído. Por favor contacta al administrador.');
        }
        throw error;
      });

      const data = response.data;
      const token = data.token;

      if (token) {
        await login(token, state.rememberMe);
        setStatus('success');
        router.push(DASHBOARD_ROUTES.DASHBOARD);
      } else {
        throw new Error('Token no recibido en el formato esperado');
      }
    } catch (err) {
      setStatus('error');
      setFormError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  const isLoading = status === 'validating' || status === 'connecting' || status === 'authenticating' || authLoading;
  const error = formError || authError;
  const statusMessage = getStatusMessage(status);

  return {
    state,
    validation,
    status,
    error,
    statusMessage,
    isLoading,
    handleInputChange,
    handleSubmit
  };
};
