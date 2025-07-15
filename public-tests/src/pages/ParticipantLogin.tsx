import { useState } from 'react';
import { Participant } from '../../../shared/interfaces/participant';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthLegalText } from '../components/auth/AuthLegalText';
import { AuthSubmitButton } from '../components/auth/AuthSubmitButton';
import FormField from '../components/common/FormField';

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
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simular delay de login
      await new Promise(resolve => setTimeout(resolve, 1000));

      const participantData: Participant = {
        name: participant.name,
        email: participant.email,
      };

      onLoginSuccess(participantData);
    } catch (error) {
      setErrors({ submit: 'Error al iniciar sesión. Intenta de nuevo.' });
    } finally {
      setIsLoading(false);
    }
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
            disabled={isLoading}
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
            disabled={isLoading}
          />

          <AuthSubmitButton
            isLoading={isLoading}
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
