import { useState } from 'react';
import { researchInProgressAPI } from '../../lib/api';

interface DeleteParticipantDebuggerProps {
  researchId?: string;
  participantId?: string;
}

export function DeleteParticipantDebugger({ researchId, participantId }: DeleteParticipantDebuggerProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async () => {
    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('🧪 Probando endpoint de eliminación de participantes...');

      const response = await researchInProgressAPI.deleteParticipant(
        researchId || 'test-research-id',
        participantId || 'test-participant-id'
      );

      setTestResult(response);

      if (response.success) {
        console.log('✅ Endpoint funcionando correctamente');
      } else {
        console.error('❌ Error en endpoint:', response);
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      console.error('❌ Error probando endpoint:', err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">🧪 Debugger: Eliminación de Participantes</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research ID:
          </label>
          <input
            type="text"
            value={researchId || ''}
            onChange={(e) => console.log('Research ID:', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="ID de investigación"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Participant ID:
          </label>
          <input
            type="text"
            value={participantId || ''}
            onChange={(e) => console.log('Participant ID:', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="ID de participante"
          />
        </div>

        <button
          onClick={testEndpoint}
          disabled={isTesting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isTesting ? 'Probando...' : 'Probar Endpoint'}
        </button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {testResult && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>Resultado:</strong>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
