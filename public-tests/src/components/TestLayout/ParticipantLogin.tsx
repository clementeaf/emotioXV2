import React, { useState } from 'react';
import { useMonitoringWebSocket } from '../../hooks/useMonitoringWebSocket';
import { useTestStore } from '../../stores/useTestStore';

interface ParticipantLoginProps {
  onLogin: (email: string) => void;
}

export const ParticipantLogin: React.FC<ParticipantLoginProps> = ({ onLogin }) => {
  const { researchId } = useTestStore();
  const { sendParticipantLogin } = useMonitoringWebSocket();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setIsLoading(true);

    try {
      // 🎯 ENVIAR EVENTO DE LOGIN
      const participantId = `participant-${Date.now()}`;
      sendParticipantLogin(participantId, email);

      // 🎯 CONTINUAR CON FLUJO NORMAL
      onLogin(email);
    } catch (error) {
      console.error('[ParticipantLogin] Error en login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido a la investigación
        </h2>
        <p className="text-gray-600">
          Por favor, ingresa tu correo electrónico para comenzar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tu@email.com"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!email.trim() || isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Iniciando...' : 'Comenzar investigación'}
        </button>
      </form>
    </div>
  );
};
