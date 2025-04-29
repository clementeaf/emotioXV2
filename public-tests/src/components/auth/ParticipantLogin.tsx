import { useState } from 'react';
import { Participant } from '../../../../shared/interfaces/participant';
import { config } from '../../config/env';

interface ParticipantLoginProps {
  onLogin: (participant: Participant) => void;
  researchId: string;
}

export const ParticipantLogin = ({ onLogin, researchId }: ParticipantLoginProps) => {
  const [participant, setParticipant] = useState<Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    email: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    submit: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      email: '',
      submit: ''
    };

    if (!participant.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (participant.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!participant.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(loginResult.error || 'Error al iniciar sesión');
        }

        if (loginResult.data?.token) {
          localStorage.setItem('participantToken', loginResult.data.token);
          onLogin(loginResult.data.participant);
        } else {
          throw new Error('No se recibió el token de autenticación');
        }
      } catch (error: any) {
        setErrors(prev => ({ 
          ...prev, 
          submit: error.message || 'Error al iniciar sesión. Por favor, intenta nuevamente.' 
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-neutral-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <span className="bg-yellow-400 text-black rounded-full w-12 h-12 flex items-center justify-center text-2xl mb-4">
            😀
          </span>
          <span className="text-2xl font-semibold text-neutral-900">
            EmotioX
          </span>
        </div>

        <h2 className="text-2xl font-bold text-center text-neutral-900 mb-8">
          Bienvenido a la Investigación
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
              {errors.submit}
            </p>
          )}
          
          <div>
            <label 
              htmlFor="name" 
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={participant.name}
              onChange={(e) => setParticipant({ ...participant, name: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 ${
                errors.name ? 'border-red-500' : 'border-neutral-300'
              }`}
              placeholder="Tu nombre completo"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={participant.email}
              onChange={(e) => setParticipant({ ...participant, email: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 ${
                errors.email ? 'border-red-500' : 'border-neutral-300'
              }`}
              placeholder="tu@email.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#121829] hover:bg-[#1e293e] text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Continuar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Al continuar, aceptas nuestros{' '}
          <a href="#" className="text-neutral-900 hover:underline">
            Términos y Condiciones
          </a>
          {' '}y{' '}
          <a href="#" className="text-neutral-900 hover:underline">
            Política de Privacidad
          </a>
        </p>
      </div>
    </div>
  );
}; 