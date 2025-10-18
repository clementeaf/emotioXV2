import React from 'react';

interface ResearchSummaryProps {
  formData: {
    name: string;
    companyId: string;
    type?: string;
    technique?: string;
  };
  countdown: number;
}

export const ResearchSummary: React.FC<ResearchSummaryProps> = ({
  formData,
  countdown
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-green-800 mb-2">
          ¡Investigación Creada Exitosamente!
        </h2>
        <p className="text-green-600">
          Redirigiendo en {countdown} segundos...
        </p>
      </div>

      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-4">Resumen de la Investigación</h3>
        
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-700">Nombre:</span>
            <span className="ml-2 text-gray-900">{formData.name}</span>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Empresa:</span>
            <span className="ml-2 text-gray-900">{formData.companyId}</span>
          </div>
          
          {formData.type && (
            <div>
              <span className="font-medium text-gray-700">Tipo:</span>
              <span className="ml-2 text-gray-900">{formData.type}</span>
            </div>
          )}
          
          {formData.technique && (
            <div>
              <span className="font-medium text-gray-700">Técnica:</span>
              <span className="ml-2 text-gray-900">{formData.technique}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
