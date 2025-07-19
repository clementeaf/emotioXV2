import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthLegalText } from '../components/auth/AuthLegalText';
import { AuthSubmitButton } from '../components/auth/AuthSubmitButton';
import FormField from '../components/common/FormField';
import { MobileBlockedScreen } from '../components/common/MobileBlockedScreen';
import { useEyeTrackingConfigQuery } from '../hooks/useEyeTrackingConfigQuery';
import { useMobileDeviceCheck } from '../hooks/useMobileDeviceCheck';
import { apiRequest } from '../lib/alova';

interface Participant {
  id: string;
  name: string;
  email: string;
  token: string;
}

interface ParticipantLoginProps {
  researchId: string;
  onLoginSuccess: (participant: Participant) => void;
  onLogin: () => void;
}

export const ParticipantLogin = ({ onLoginSuccess, researchId }: ParticipantLoginProps) => {
  const [participant, setParticipant] = useState({
    name: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🎯 VERIFICACIÓN DE DISPOSITIVO MÓVIL - TODOS LOS HOOKS AL INICIO
  const { data: eyeTrackingConfig, isLoading: isLoadingConfig } = useEyeTrackingConfigQuery(researchId);
  const {
    isMobileOrTablet,
    deviceType,
    allowMobile,
    configFound,
    shouldBlock,
    isLoading: isLoadingMobileCheck,
    error: mobileCheckError
  } = useMobileDeviceCheck(researchId, eyeTrackingConfig || null);

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

  // 🚨 BLOQUEAR ACCESO SI ES MÓVIL NO PERMITIDO
  if (shouldBlock && deviceType === 'mobile') {
    return <MobileBlockedScreen deviceType="mobile" researchId={researchId} />;
  }

  if (shouldBlock && deviceType === 'tablet') {
    return <MobileBlockedScreen deviceType="tablet" researchId={researchId} />;
  }

  // Mostrar loading mientras se verifica la configuración
  if (isLoadingConfig || isLoadingMobileCheck) {
    return (
      <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-white z-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verificando configuración...
          </h2>
          <p className="text-gray-600">
            Comprobando si tu dispositivo puede acceder a esta investigación.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar error si falla la verificación
  if (mobileCheckError) {
    return (
      <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-white z-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error de Verificación
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo verificar la configuración de tu dispositivo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Log para debugging
  console.log('[ParticipantLogin] Estado de dispositivo:', {
    deviceType,
    isMobileOrTablet,
    allowMobile,
    configFound,
    shouldBlock,
    researchId
  });

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

        {/* Información de dispositivo para debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p><strong>Dispositivo:</strong> {deviceType}</p>
            <p><strong>Permitir móvil:</strong> {allowMobile ? 'Sí' : 'No'}</p>
            <p><strong>Config encontrada:</strong> {configFound ? 'Sí' : 'No'}</p>
          </div>
        )}

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
