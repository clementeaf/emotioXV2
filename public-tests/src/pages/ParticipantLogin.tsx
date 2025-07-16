import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Participant } from '../../../shared/interfaces/participant';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthLegalText } from '../components/auth/AuthLegalText';
import { AuthSubmitButton } from '../components/auth/AuthSubmitButton';
import FormField from '../components/common/FormField';
import { apiRequest } from '../lib/alova';

export interface ParticipantLoginProps {
  researchId: string;
  onLogin: (participantData: Participant) => void;
  onLoginSuccess: (participant: Participant) => void;
}

export const ParticipantLogin = ({ onLoginSuccess, researchId }: ParticipantLoginProps) => {
  const [participant, setParticipant] = useState({
    name: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParticipant(prev => ({ ...prev, [name]: value }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!participant.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!participant.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(participant.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; researchId: string }) => {
      return apiRequest<{ data: { participant: { id: string; name: string; email: string }; token: string } }>('participants/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      const participantData: Participant = {
        id: data.data.participant.id,
        name: data.data.participant.name,
        email: data.data.participant.email,
        token: data.data.token
      };
      onLoginSuccess(participantData);
    },
    onError: (error: Error) => {
      console.error('Error en login:', error);
      setErrors({ submit: error.message || 'Error al iniciar sesión. Intenta de nuevo.' });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    loginMutation.mutate({
      name: participant.name,
      email: participant.email,
      researchId: researchId
    });
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-white z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md h-fit">
        <AuthHeader title="EmotioX" />

        <h2 className="text-2xl font-bold text-center text-neutral-900 mb-8">
          Bienvenido a la Investigación
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="text-sm text-red-500 text-center bg-red-50 p-3 rounded border border-red-200">
              {errors.submit.split('\n').map((line, index) => (
                <p key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
          )}

          <FormField
            id="name"
            label="Nombre"
            name="name"
            type="text"
            value={participant.name}
            onChange={handleInputChange}
            placeholder="Tu nombre completo"
            error={errors.name}
            disabled={loginMutation.isPending}
          />

          <FormField
            id="email"
            label="Email"
            name="email"
            type="email"
            value={participant.email}
            onChange={handleInputChange}
            placeholder="tu@email.com"
            error={errors.email}
            disabled={loginMutation.isPending}
          />

          <AuthSubmitButton
            isLoading={loginMutation.isPending}
            loadingText="Iniciando sesión..."
            text="Continuar"
            className="mt-6"
          />
        </form>

        <AuthLegalText />
      </div>
    </div>
  );
};

export default ParticipantLogin;
