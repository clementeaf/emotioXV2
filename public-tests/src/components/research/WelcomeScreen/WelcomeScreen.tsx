import { useEffect, useState, useCallback } from 'react';
import { config } from '../../../config/env';

interface WelcomeScreenData {
  id: string;
  researchId: string;
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  metadata?: {
    version?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DefaultValues {
  title: boolean;
  message: boolean;
  startButtonText: boolean;
}

interface WelcomeScreenProps {
  onStart: () => void;
  researchId: string;
  onError?: (error: string) => void;
}

export const WelcomeScreen = ({ onStart, researchId, onError }: WelcomeScreenProps) => {
  const [welcomeData, setWelcomeData] = useState<WelcomeScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [defaultsUsed, setDefaultsUsed] = useState<DefaultValues>({
    title: false,
    message: false,
    startButtonText: false
  });

  // Valores predeterminados
  const defaults = {
    title: 'Hello! You has been invited',
    message: 'You have been invited to participate in a survey to improve the future experience of our customers, so we need your help to make this the best experience possible.',
    startButtonText: 'Iniciar Investigación'
  };

  // Manejar errores de forma centralizada
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  }, [onError]);

  // Validar el token
  const getValidToken = useCallback((): string => {
    const token = localStorage.getItem('participantToken');
    if (!token) {
      throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
    }
    return token;
  }, []);

  // Validar la respuesta de la API
  const validateApiResponse = useCallback((data: any): WelcomeScreenData => {
    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta inválida del servidor');
    }

    // Validar campos requeridos
    const requiredFields = ['id', 'researchId', 'createdAt', 'updatedAt'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Datos incompletos: falta el campo ${field}`);
      }
    }

    return data as WelcomeScreenData;
  }, []);

  // Fetch de datos
  const fetchWelcomeScreen = useCallback(async () => {
    console.log('🔍 Iniciando fetch de WelcomeScreen...');
    console.log('📝 Research ID:', researchId);
    
    try {
      const token = getValidToken();
      console.log('🔑 Token obtenido correctamente');

      const url = `${config.apiUrl}/research/${researchId}/welcome-screen`;
      console.log('🌐 URL de la petición:', url);

      const response = await fetch(
        url,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📨 Respuesta recibida - Status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('participantToken');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(`Error al obtener la pantalla de bienvenida: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[WelcomeScreen] API Response Data:', result);

      // Pasar 'result' directamente a la validación
      const validatedData = validateApiResponse(result);
      console.log('✅ Datos validados:', validatedData);
      setWelcomeData(validatedData);

      // Verificar qué valores están usando los predeterminados
      const newDefaultsUsed = {
        title: !validatedData.title || validatedData.title.trim() === '',
        message: !validatedData.message || validatedData.message.trim() === '',
        startButtonText: !validatedData.startButtonText || validatedData.startButtonText.trim() === ''
      };
      console.log('🎯 Valores predeterminados usados:', newDefaultsUsed);
      setDefaultsUsed(newDefaultsUsed);

    } catch (err: any) {
      console.error('❌ Error en fetchWelcomeScreen:', err);
      handleError(err.message || 'Error desconocido al cargar la pantalla de bienvenida');
    } finally {
      setIsLoading(false);
      console.log('🏁 Fetch de WelcomeScreen completado');
    }
  }, [researchId, getValidToken, validateApiResponse, handleError]);

  // Manejar el inicio de la investigación
  const handleStart = useCallback(async () => {
    if (isStarting) return;
    
    try {
      setIsStarting(true);
      // Verificar que tenemos los datos necesarios antes de empezar
      if (!welcomeData?.id) {
        throw new Error('No se pueden iniciar la investigación: datos incompletos');
      }
      onStart();
    } catch (err: any) {
      handleError(err.message || 'Error al iniciar la investigación');
    } finally {
      setIsStarting(false);
    }
  }, [welcomeData, isStarting, onStart, handleError]);

  // Efecto para cargar datos
  useEffect(() => {
    console.log('🔄 useEffect de WelcomeScreen ejecutado');
    if (!researchId) {
      console.warn('⚠️ No se proporcionó Research ID');
      handleError('ID de investigación no proporcionado');
      return;
    }
    
    fetchWelcomeScreen();
  }, [researchId, fetchWelcomeScreen, handleError]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-[90%] w-[400px]">
          <div className="text-red-500 text-center">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p>{error}</p>
            {error.includes('sesión') && (
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Volver a iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayTitle = welcomeData?.title || defaults.title;
  const displayMessage = welcomeData?.message || defaults.message;
  console.log('welcomeData', welcomeData);  
  const displayStartButtonText = welcomeData?.startButtonText || defaults.startButtonText;

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <div className="max-w-[600px] w-full px-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-12">
            <img src="/emotio-logo.png" alt="EmotioX" className="h-8 w-8 mr-2" />
            <span className="text-xl font-semibold">EmotioX</span>
          </div>

          <h1 className="text-4xl font-bold mb-2 text-center">
            {displayTitle}
          </h1>
          {defaultsUsed.title && (
            <span className="text-sm text-[#F5A623]">
              (Usando título predeterminado)
            </span>
          )}

          <div className="mt-12 mb-12">
            <p className="text-lg text-gray-600 text-center max-w-[600px]">
              {displayMessage}
            </p>
            {defaultsUsed.message && (
              <div className="text-center">
                <span className="text-sm text-[#F5A623]">
                  (Usando mensaje predeterminado)
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="bg-[#121829] text-white px-16 py-4 rounded-lg text-lg font-medium hover:bg-[#1e293e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Iniciando...' : displayStartButtonText}
            </button>
            {defaultsUsed.startButtonText && (
              <div className="text-center mt-2">
                <span className="text-sm text-[#F5A623]">
                  (Usando texto de botón predeterminado)
                </span>
              </div>
            )}
          </div>

          {welcomeData?.metadata?.version && (
            <div className="mt-12 text-sm text-gray-500 text-center">
              Versión: {welcomeData.metadata.version}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 