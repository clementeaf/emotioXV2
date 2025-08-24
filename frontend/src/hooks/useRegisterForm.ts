import { validateConfirmPassword, validateEmail, validateName, validatePassword } from '@/utils/auth-validation';
import { apiClient } from '@/config/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationState {
  name: { isValid: boolean; message: string | null };
  email: { isValid: boolean; message: string | null };
  password: { isValid: boolean; message: string | null };
  confirmPassword: { isValid: boolean; message: string | null };
}

type RegisterStatus = 'idle' | 'validating' | 'registering' | 'success' | 'error';

export const useRegisterForm = () => {
  const router = useRouter();
  const [status, setStatus] = useState<RegisterStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<RegisterFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validation, setValidation] = useState<ValidationState>({
    name: { isValid: true, message: null },
    email: { isValid: true, message: null },
    password: { isValid: true, message: null },
    confirmPassword: { isValid: true, message: null }
  });

  const handleInputChange = (field: keyof RegisterFormState, value: string) => {
    setState(prev => ({ ...prev, [field]: value }));

    if (status === 'error') {
      setStatus('idle');
      setError(null);
    }

    // Validación en tiempo real
    switch (field) {
      case 'name':
        setValidation(prev => ({ ...prev, name: validateName(value) }));
        break;
      case 'email':
        setValidation(prev => ({ ...prev, email: validateEmail(value) }));
        break;
      case 'password':
        setValidation(prev => ({ ...prev, password: validatePassword(value) }));
        // Re-validar confirmPassword si ya tiene valor
        if (state.confirmPassword) {
          setValidation(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(value, state.confirmPassword)
          }));
        }
        break;
      case 'confirmPassword':
        setValidation(prev => ({
          ...prev,
          confirmPassword: validateConfirmPassword(state.password, value)
        }));
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('validating');
    setError(null);

    // Validaciones finales
    const nameValidation = validateName(state.name);
    const emailValidation = validateEmail(state.email);
    const passwordValidation = validatePassword(state.password);
    const confirmPasswordValidation = validateConfirmPassword(state.password, state.confirmPassword);

    if (!nameValidation.isValid || !emailValidation.isValid ||
      !passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      setStatus('error');
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    setStatus('registering');

    try {
      const response = await apiClient.post('auth', 'register', {
        name: state.name,
        email: state.email,
        password: state.password
      });

      if (response?.success !== false) {
        setStatus('success');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setStatus('error');
        setError(response?.error || 'Error al registrar usuario');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error al registrar usuario. Por favor, intenta nuevamente.');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'validating': return 'Validando datos...';
      case 'registering': return 'Creando cuenta...';
      default: return null;
    }
  };

  const isLoading = status === 'validating' || status === 'registering';
  const statusMessage = getStatusMessage();

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
