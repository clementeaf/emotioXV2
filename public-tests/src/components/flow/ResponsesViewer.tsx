import React, { useState } from 'react';
import { ResponsesViewerProps } from '../../types/flow.types';

export const ResponsesViewer: React.FC<ResponsesViewerProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Formatear las fechas para mejor visualización
  const formattedData = {
    ...data,
    modules: {
      ...data.modules,
      // Formatear fechas en módulos específicos si existen
      demographic: data.modules.demographic ? {
        ...data.modules.demographic,
        createdAt: data.modules.demographic.createdAt ? new Date(data.modules.demographic.createdAt).toLocaleString() : undefined,
      } : undefined,
      cognitive_task: Array.isArray(data.modules.cognitive_task) ? data.modules.cognitive_task.map(item => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : undefined,
      })) : [],
      smartvoc: Array.isArray(data.modules.smartvoc) ? data.modules.smartvoc.map(item => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : undefined,
      })) : [],
    }
  };

  const jsonString = JSON.stringify(formattedData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error al copiar el JSON:', err);
      });
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responses_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const countResponses = () => {
    let total = 0;
    if (data.modules.demographic) total += 1;
    if (Array.isArray(data.modules.cognitive_task)) {
      total += data.modules.cognitive_task.length;
    }
    if (Array.isArray(data.modules.smartvoc)) {
      total += data.modules.smartvoc.length;
    }
    return total;
  };

  const totalModules = countResponses();

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Datos de respuestas guardadas</h2>
        <div className="space-x-2">
          <button
            onClick={handleCopy}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            {copied ? '✓ Copiado' : 'Copiar JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          >
            Descargar JSON
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-700">
          <span className="font-semibold">Total de respuestas:</span> {totalModules}
        </p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-100 p-2 border-b">
          <h3 className="font-mono text-sm font-semibold">JSON completo</h3>
        </div>
        <pre className="p-4 overflow-auto text-xs max-h-96 font-mono bg-gray-50">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};
