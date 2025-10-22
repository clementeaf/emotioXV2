/**
 * Formulario de creación de investigación optimizado
 * Versión simplificada después de limpieza radical
 */
import React from 'react';

export const CreateResearchFormOptimized: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Crear Nueva Investigación
        </h1>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">
              🚧 Sistema en Desarrollo
            </h2>
            <p className="text-blue-700 mb-4">
              Este formulario será reemplazado por un sistema JSON-driven 
              que permitirá crear investigaciones dinámicamente sin código.
            </p>
            <div className="bg-white border border-blue-300 rounded p-4">
              <h3 className="font-medium text-gray-900 mb-2">Funcionalidades Futuras:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Formularios dinámicos basados en JSON schema</li>
                <li>• Configuración visual de etapas de investigación</li>
                <li>• Templates predefinidos para diferentes tipos de estudios</li>
                <li>• Validación automática de configuraciones</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              Estado Actual
            </h2>
            <p className="text-gray-600">
              Los componentes de formularios han sido eliminados como parte de la 
              limpieza radical para implementar el sistema JSON-driven.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateResearchFormOptimized;