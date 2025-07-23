import React, { useEffect, useState } from 'react';
import { debugEnvironmentVariables } from '../../utils/debug-env';
import { testDynamicEndpoints, testDynamicWebSocketConnection } from '../../utils/test-dynamic-endpoints';
import { testMonitoringWebSocket, testWebSocketConnection } from '../../utils/test-websocket';

interface WebSocketDebuggerProps {
  researchId?: string;
}

export const WebSocketDebugger: React.FC<WebSocketDebuggerProps> = ({ researchId }) => {
  const [testResults, setTestResults] = useState<{
    basicConnection: boolean | null;
    monitoringConnection: boolean | null;
    dynamicEndpoints: boolean | null;
    dynamicWebSocket: boolean | null;
    envVars: any;
  }>({
    basicConnection: null,
    monitoringConnection: null,
    dynamicEndpoints: null,
    dynamicWebSocket: null,
    envVars: null
  });

  const [isTesting, setIsTesting] = useState(false);

  const runTests = async () => {
    setIsTesting(true);

    // Verificar variables de entorno
    const envVars = debugEnvironmentVariables();

    // Probar conexión básica
    const basicResult = await testWebSocketConnection();

    // Probar conexión de monitoreo
    const monitoringResult = researchId ? await testMonitoringWebSocket(researchId) : null;

    // Probar endpoints dinámicos
    const dynamicEndpointsResult = await testDynamicEndpoints();

    // Probar WebSocket dinámico
    const dynamicWebSocketResult = await testDynamicWebSocketConnection();

    setTestResults({
      basicConnection: basicResult,
      monitoringConnection: monitoringResult,
      dynamicEndpoints: dynamicEndpointsResult.success,
      dynamicWebSocket: dynamicWebSocketResult.success,
      envVars
    });

    setIsTesting(false);
  };

  useEffect(() => {
    // Ejecutar pruebas automáticamente al montar
    runTests();
  }, [researchId]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">🔌 Diagnóstico WebSocket</h3>

      <div className="space-y-4">
        {/* Estado de las pruebas */}
        <div>
          <h4 className="font-medium mb-2">🧪 Resultados de Pruebas:</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>🔌 Conexión básica:</span>
              {testResults.basicConnection === null ? (
                <span className="text-gray-500">Pendiente...</span>
              ) : testResults.basicConnection ? (
                <span className="text-green-600">✅ Funciona</span>
              ) : (
                <span className="text-red-600">❌ Falló</span>
              )}
            </div>

            {researchId && (
              <div className="flex items-center space-x-2">
                <span>📡 Monitoreo ({researchId}):</span>
                {testResults.monitoringConnection === null ? (
                  <span className="text-gray-500">Pendiente...</span>
                ) : testResults.monitoringConnection ? (
                  <span className="text-green-600">✅ Funciona</span>
                ) : (
                  <span className="text-red-600">❌ Falló</span>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <span>🔄 Endpoints dinámicos:</span>
              {testResults.dynamicEndpoints === null ? (
                <span className="text-gray-500">Pendiente...</span>
              ) : testResults.dynamicEndpoints ? (
                <span className="text-green-600">✅ Funciona</span>
              ) : (
                <span className="text-red-600">❌ Falló</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span>🔌 WebSocket dinámico:</span>
              {testResults.dynamicWebSocket === null ? (
                <span className="text-gray-500">Pendiente...</span>
              ) : testResults.dynamicWebSocket ? (
                <span className="text-green-600">✅ Funciona</span>
              ) : (
                <span className="text-red-600">❌ Falló</span>
              )}
            </div>
          </div>
        </div>

        {/* Variables de entorno */}
        {testResults.envVars && (
          <div>
            <h4 className="font-medium mb-2">⚙️ Variables de Entorno:</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div className="space-y-1">
                <div>
                  <span className="font-medium">API URL:</span> {testResults.envVars.apiUrl}
                </div>
                <div>
                  <span className="font-medium">WS URL:</span> {testResults.envVars.wsUrl}
                </div>
                <div>
                  <span className="font-medium">Seguro:</span> {testResults.envVars.isSecure ? '✅ Sí' : '❌ No'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de re-ejecutar */}
        <div>
          <button
            onClick={runTests}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isTesting ? '🔄 Probando...' : '🔄 Re-ejecutar Pruebas'}
          </button>
        </div>

        {/* Información adicional */}
        <div className="text-sm text-gray-600">
          <p>💡 Este diagnóstico verifica:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Conexión básica al WebSocket</li>
            <li>Suscripción a eventos de monitoreo</li>
            <li>Carga de endpoints dinámicos</li>
            <li>Conexión WebSocket con endpoints dinámicos</li>
            <li>Configuración de variables de entorno</li>
            <li>Seguridad de las URLs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
