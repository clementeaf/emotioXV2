import { ChangeEvent, FormEvent, useState } from 'react';
import { Participant } from '../../../shared/interfaces/participant';
import { ParticipantState, useParticipantStore } from '../stores/participantStore';
import { FormErrors } from '../types';
import { UseParticipantLoginProps } from '../types/hooks.types';

// Tipo para el estado del participante dentro del hook
type ParticipantInput = Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>;

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

export const useParticipantLogin = ({ researchId, onLogin }: UseParticipantLoginProps) => {
  const [participant, setParticipant] = useState<ParticipantInput>({
    name: '',
    email: ''
  });

  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    email: '',
    submit: '',
    researchId: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  // Obtener la función para setear researchId en el store global
  const setResearchIdInStore = useParticipantStore((state: ParticipantState) => state.setResearchId);

  // Función para manejar cambios en los inputs
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParticipant(prev => ({ ...prev, [name]: value }));
    // Limpiar error específico del campo al escribir
    if (errors[name as keyof Omit<FormErrors, 'submit' | 'researchId'>]) {
        setErrors(prev => ({...prev, [name]: ''}));
    }
    // Limpiar error de submit al empezar a corregir
     if (errors.submit) {
        setErrors(prev => ({...prev, submit: ''}));
    }
  };

  // Función de validación interna
  const validate = (): boolean => {
    const newErrors: FormErrors = { name: '', email: '', submit: '', researchId: '' };
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

    if (!researchId) {
      newErrors.researchId = 'El ID de investigación es requerido (error de configuración)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Función de submit (lógica de API)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors(prev => ({ ...prev, submit: '' }));

    try {
      const response = await fetch(`${API_BASE_URL}/participants/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: participant.name,
          email: participant.email,
          researchId
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || `Error ${response.status} al iniciar sesión.`;
        console.error('[useParticipantLogin] Login API Error:', responseData);
        setErrors(prev => ({ ...prev, submit: errorMessage }));
        setIsLoading(false);
        return;
      }

      const apiParticipant = responseData.data.participant as Participant;
      const apiToken = responseData.data.token as string;

      if (!apiParticipant || !apiToken) {
        console.error('[useParticipantLogin] Respuesta de login incompleta:', responseData);
        setErrors(prev => ({ ...prev, submit: 'Respuesta inesperada del servidor después del login.' }));
        setIsLoading(false);
        return;
      }

      // Guardar el token y el participantId en localStorage
      localStorage.setItem('participantToken', apiToken);
      localStorage.setItem('participantId', apiParticipant.id);

      setResearchIdInStore(researchId);

      if (typeof onLogin === 'function') {
        onLogin(apiParticipant);
      } else {
        console.error('[useParticipantLogin] onLogin no es una función. No se pudo notificar el login.');
      }

    } catch (error) {
      console.error('[useParticipantLogin] Excepción en handleSubmit:', error);
      setErrors(prev => ({ ...prev, submit: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.' }));
      setIsLoading(false);
    }
  };

  // Devolver estados y funciones para la UI
  return {
    participant,      // Estado actual del formulario
    errors,           // Errores de validación/submit
    isLoading,        // Estado de carga
    handleInputChange,// Función para actualizar inputs
    handleSubmit,     // Función para manejar el submit del form
  };
};
