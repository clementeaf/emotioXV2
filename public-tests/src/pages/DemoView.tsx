import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Pantalla de demostración para simular cómo funcionaría un enlace de eye tracking
 * Esta página recibe parámetros de URL para mostrar cómo sería la experiencia real
 */
export default function DemoView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [participantId, setParticipantId] = useState<string>('');
  const [countdown, setCountdown] = useState(10);

  // Extraer parámetros de la URL
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const url = searchParams.get('original_url');
      const id = searchParams.get('participant_id');

      if (!url) {
        throw new Error('No se proporcionó URL original');
      }

      setOriginalUrl(url);
      setParticipantId(id || 'EXAMPLE_ID_123');
      setLoading(false);
    } catch (err) {
      setError('Error al procesar los parámetros de la URL');
      setLoading(false);
    }
  }, [location]);

  // Simulación de cuenta regresiva para redirección
  useEffect(() => {
    if (!loading && !error) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // No redirigimos realmente para evitar error 404
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, error]);

  // Función para volver a la vista principal
  const handleGoBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-r-2 border-neutral-300 mb-4"></div>
        <h2 className="text-xl font-semibold text-neutral-800">Cargando vista previa...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg max-w-2xl w-full mb-4">
          <h2 className="font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
        <button 
          onClick={handleGoBack}
          className="px-4 py-2 bg-neutral-800 text-white rounded-lg shadow hover:bg-neutral-700"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  // URL final simulada (reemplazando el marcador con el ID real)
  const finalUrl = originalUrl.replace(/\{participant_id\}|{participant_id}/, participantId);

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center mr-2 shadow-sm">
              😀
            </div>
            <h1 className="text-2xl font-bold">EmotioX - Vista Previa</h1>
          </div>
          <div className="h-1 w-full bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out" 
              style={{ width: `${(countdown / 10) * 100}%` }}
            ></div>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Vista previa del enlace de investigación</h2>
          
          <div className="mb-6">
            <p className="text-sm text-neutral-500 mb-2">URL Original (con placeholder):</p>
            <div className="bg-neutral-50 p-3 rounded border border-neutral-200 font-mono text-sm break-all">
              https://{originalUrl}
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-neutral-500 mb-2">URL Final (con ID de participante):</p>
            <div className="bg-blue-50 p-3 rounded border border-blue-200 font-mono text-sm break-all">
              https://{finalUrl}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-neutral-500 mb-2">ID de Participante:</p>
            <div className="bg-green-50 p-3 rounded border border-green-200 font-mono text-sm">
              {participantId}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-2 text-amber-800">Información</h3>
          <p className="text-amber-700 mb-4">
            Esta es una simulación de cómo funcionaría el enlace de investigación. En un entorno real:
          </p>
          <ul className="list-disc pl-5 text-amber-700 space-y-2">
            <li>El sistema de panel de encuestas reemplazaría <code className="bg-amber-100 px-1 rounded">{"{participant_id}"}</code> con un ID único para cada participante</li>
            <li>El participante sería dirigido a la página real de eye tracking</li>
            <li>Al finalizar, sería redirigido a los enlaces de retorno configurados</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-neutral-500 mb-4">
            {countdown > 0 
              ? `Regresando a la página principal en ${countdown} segundos...` 
              : 'Tiempo de espera finalizado'}
          </p>
          <button 
            onClick={handleGoBack}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg shadow hover:bg-neutral-700"
          >
            Volver al panel
          </button>
        </div>
      </div>
    </div>
  );
} 