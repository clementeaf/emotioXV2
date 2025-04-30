import { useState, useCallback } from 'react';
import { Participant } from '../../../shared/interfaces/participant';
import { config } from '../config/env';

// Argumentos que necesita el hook
interface UseParticipantLoginProps {
  researchId: string;
  onLogin: (participant: Participant) => void;
}

// Tipo para el estado del participante dentro del hook
type ParticipantInput = Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>;

// Tipo para los errores del formulario
interface FormErrors {
  name: string;
  email: string;
  submit: string;
}

export const useParticipantLogin = ({ researchId, onLogin }: UseParticipantLoginProps) => {
  const [participant, setParticipant] = useState<ParticipantInput>({
    name: '',
    email: ''
  });

  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    email: '',
    submit: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  // Función para manejar cambios en los inputs
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParticipant(prev => ({ ...prev, [name]: value }));
    // Limpiar error específico del campo al escribir
    if (errors[name as keyof Omit<FormErrors, 'submit'>]) {
        setErrors(prev => ({...prev, [name]: ''}));
    }
    // Limpiar error de submit al empezar a corregir
     if (errors.submit) {
        setErrors(prev => ({...prev, submit: ''}));
    }
  }, [errors]); // Depende de errors para limpiar

  // Función de validación interna
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = { name: '', email: '', submit: '' };
    let isValid = true;

    if (!participant.name.trim()) {
      newErrors.name = 'El nombre es requerido';
      isValid = false;
    } else if (participant.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
       isValid = false;
    }

    if (!participant.email.trim()) {
      newErrors.email = 'El email es requerido';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
      newErrors.email = 'El email no es válido';
       isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [participant]); // Depende del estado del participante

  // Función de submit (lógica de API)
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault(); // Permitir llamar sin evento si es necesario
    setErrors(prev => ({ ...prev, submit: '' })); // Limpiar error submit previo

    if (validateForm()) {
      setIsLoading(true);
      try {
        const payload = {
          name: participant.name,
          email: participant.email,
          researchId: researchId
        };
        
        const loginResponse = await fetch(`${config.apiUrl}/participants/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(loginResult.error || 'Error al iniciar sesión desde el servidor.');
        }

        if (loginResult.data?.token && loginResult.data?.participant) {
          // Guardar token en localStorage (responsabilidad del login)
          localStorage.setItem('participantToken', loginResult.data.token);
          // Llamar al callback onLogin pasado como prop
          onLogin(loginResult.data.participant);
        } else {
          throw new Error('Respuesta inesperada del servidor (faltan datos).');
        }
      } catch (error: any) {
        console.error("[useParticipantLogin] Error en handleSubmit:", error);
        setErrors(prev => ({ 
          ...prev, 
          submit: error.message || 'Error al iniciar sesión. Intenta nuevamente.' 
        }));
      } finally {
        setIsLoading(false);
      }
    }
  }, [participant, researchId, onLogin, validateForm]); // Dependencias clave

  // Devolver estados y funciones para la UI
  return {
    participant,      // Estado actual del formulario
    errors,           // Errores de validación/submit
    isLoading,        // Estado de carga
    handleInputChange,// Función para actualizar inputs
    handleSubmit,     // Función para manejar el submit del form
  };
}; 