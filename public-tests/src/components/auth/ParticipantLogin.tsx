import { Participant } from '../../../../shared/interfaces/participant';
import { useParticipantLogin } from '../../hooks/useParticipantLogin';
import { AuthHeader } from './AuthHeader';
import FormField from '../common/FormField';
import { AuthSubmitButton } from './AuthSubmitButton';
import { AuthLegalText } from './AuthLegalText';

export interface ParticipantLoginProps {
  researchId: string;
  onLogin: (participantData: Participant) => void;
  onLoginSuccess: (participant: Participant) => void;
}

export const ParticipantLogin = ({ onLoginSuccess, researchId }: ParticipantLoginProps) => {
  const {
    participant,      
    errors,           
    isLoading,        
    handleInputChange,
    handleSubmit,     
  } = useParticipantLogin({ researchId, onLogin: onLoginSuccess });

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-neutral-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <AuthHeader title="EmotioX" />

        <h2 className="text-2xl font-bold text-center text-neutral-900 mb-8">
          Bienvenido a la Investigación
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded border border-red-200">
              {errors.submit}
            </p>
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