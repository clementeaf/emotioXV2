import React from 'react';
import { useSearchParams } from 'react-router-dom';

const ResearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const researchId = searchParams.get('research');
  const section = searchParams.get('section') || 'overview';

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">
          Investigación #{researchId}
        </h1>
        <p className="text-blue-600">
          Sección: {section}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Datos de Investigación</h3>
          <p className="text-green-600">Información específica de la investigación</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Participantes</h3>
          <p className="text-purple-600">Gestión de participantes activos</p>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Resultados</h3>
          <p className="text-orange-600">Análisis y reportes</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Información de la URL</h2>
        <p><strong>Research ID:</strong> {researchId}</p>
        <p><strong>Section:</strong> {section}</p>
        <p><strong>URL completa:</strong> {window.location.href}</p>
      </div>
    </div>
  );
};

export default ResearchPage;
