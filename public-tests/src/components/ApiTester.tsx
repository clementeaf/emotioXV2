import { useState, useCallback } from 'react';
import {
  testCreateParticipant,
  testGetParticipant,
  testGetAllParticipants,
  testDeleteParticipant,
  testGetWelcomeScreen,
  runAllTests
} from '../utils/api-test';
import { eyeTrackingService } from '../services/eyeTracking.service';
import { EyeTrackingFormData } from '../../../shared/interfaces/eye-tracking.interface';

export const ApiTester = () => {
  const [participantId, setParticipantId] = useState('');
  const [researchId, setResearchId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<EyeTrackingFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener la configuración de eye tracking
  const fetchEyeTracking = useCallback(async () => {
    if (!researchId) {
      setError('Se requiere un ID de investigación');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await eyeTrackingService.getEyeTrackingConfig(researchId, token);
      
      if (result.error) {
        setError(result.message || 'Error al obtener datos de eye tracking');
      } else {
        setResponse(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [researchId, token]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Pruebas de API</h2>

      <div className="space-y-6">
        {/* Crear Participante */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Crear Participante</h3>
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <button
            onClick={() => testCreateParticipant(name, email)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Crear
          </button>
        </div>

        {/* Obtener Participante */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Obtener Participante</h3>
          <input
            type="text"
            placeholder="ID del Participante"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <button
            onClick={() => testGetParticipant(participantId)}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Obtener
          </button>
        </div>

        {/* Obtener Todos los Participantes */}
        <div>
          <button
            onClick={() => testGetAllParticipants()}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Obtener Todos los Participantes
          </button>
        </div>

        {/* Eliminar Participante */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Eliminar Participante</h3>
          <input
            type="text"
            placeholder="ID del Participante"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <button
            onClick={() => testDeleteParticipant(participantId)}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Eliminar
          </button>
        </div>

        {/* Obtener Pantalla de Bienvenida */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Obtener Pantalla de Bienvenida</h3>
          <input
            type="text"
            placeholder="ID de Investigación"
            value={researchId}
            onChange={(e) => setResearchId(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <button
            onClick={() => testGetWelcomeScreen(researchId)}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Obtener
          </button>
        </div>

        {/* Ejecutar Todas las Pruebas */}
        <div className="mt-8">
          <button
            onClick={runAllTests}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Ejecutar Todas las Pruebas
          </button>
        </div>

        {/* Eye Tracking API */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Eye Tracking API</h2>
          
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Token de autenticación (opcional)
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ingresa el token de autenticación"
              />
            </div>
            
            <div>
              <label htmlFor="researchId" className="block text-sm font-medium text-gray-700 mb-1">
                ID de investigación
              </label>
              <input
                id="researchId"
                type="text"
                value={researchId}
                onChange={(e) => setResearchId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ingresa el ID de la investigación"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={fetchEyeTracking}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Obtener configuración de Eye Tracking'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {response && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Respuesta</h3>
              <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-auto max-h-96">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm text-gray-600">
          Nota: Abre la consola del navegador para ver los resultados de las pruebas.
        </p>
      </div>
    </div>
  );
}; 