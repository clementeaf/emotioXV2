import { useState } from 'react';
import {
  testCreateParticipant,
  testGetParticipant,
  testGetAllParticipants,
  testDeleteParticipant,
  testGetWelcomeScreen,
  runAllTests
} from '../utils/api-test';

export const ApiTester = () => {
  const [participantId, setParticipantId] = useState('');
  const [researchId, setResearchId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

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
      </div>

      <div className="mt-8">
        <p className="text-sm text-gray-600">
          Nota: Abre la consola del navegador para ver los resultados de las pruebas.
        </p>
      </div>
    </div>
  );
}; 