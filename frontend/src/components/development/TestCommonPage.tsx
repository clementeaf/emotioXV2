import React, { useState } from 'react';
import { FormCard } from '@/components/common/FormCard';
import { FormToggle } from '@/components/common/FormToggle';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { ActionButton } from '@/components/common/ActionButton';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { OptimisticFormWrapper } from '@/components/common/OptimisticFormWrapper';
import { OptimisticButton } from '@/components/common/OptimisticButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ConfigCard } from '@/components/common/ConfigCard';
import { DevModeInfo } from '@/components/common/DevModeInfo';
import { ProgressiveLoader } from '@/components/common/ProgressiveLoader';
import { SimulatedDataBanner } from '@/components/common/SimulatedDataBanner';
import { COMPONENT_EXAMPLES, ComponentHandlers } from './component-examples.config';

// Mapeo dinámico de componentes
const COMPONENT_MAP = {
  FormCard,
  FormToggle,
  FormInput,
  FormTextarea,
  ActionButton,
  LoadingSkeleton,
  OptimisticFormWrapper,
  OptimisticButton,
  ErrorBoundary,
  ConfigCard,
  DevModeInfo,
  ProgressiveLoader,
  SimulatedDataBanner
} as const;

/**
 * Página de prueba para componentes comunes
 * Solo visible en ambiente de desarrollo
 */
export const TestCommonPage: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    isEnabled: true,
    title: 'Bienvenido a la investigación',
    message: 'A continuación se te pedirá responder una serie de preguntas',
    buttonText: 'Comenzar'
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    console.log('Form submitted:', formData);
  };

  const handlePreview = () => {
    console.log('Preview:', formData);
  };

  const handleDelete = () => {
    console.log('Delete clicked');
  };

  // Lista de componentes disponibles - GENERADA AUTOMÁTICAMENTE
  const commonComponents = Object.keys(COMPONENT_MAP);

  // Handlers para pasar a los componentes
  const handlers: ComponentHandlers = {
    handleChange,
    handleSubmit,
    handlePreview,
    handleDelete
  };

  // Función para renderizar componente dinámicamente
  const renderComponent = (componentName: string) => {
    const Component = COMPONENT_MAP[componentName as keyof typeof COMPONENT_MAP];
    const example = COMPONENT_EXAMPLES[componentName as keyof typeof COMPONENT_EXAMPLES];
    
    if (!Component || !example) {
      return <div>Componente no encontrado: {componentName}</div>;
    }

    return (
      <FormCard title={example.title}>
        {example.children(formData, handlers)}
      </FormCard>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar izquierdo con lista de componentes */}
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Components Common
        </h2>
        <div className="space-y-2">
          {commonComponents.map((component) => (
            <button
              key={component}
              onClick={() => setSelectedComponent(component)}
              className={`
                w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                ${selectedComponent === component
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              {component}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Test Common Components
            </h1>
            <p className="text-gray-600">
              Página de prueba para componentes comunes reutilizables
            </p>
          </div>

          {/* Renderizar componente seleccionado - DINÁMICO */}
          {selectedComponent && renderComponent(selectedComponent)}
          
          {/* Mostrar ejemplos principales si no hay selección */}
          {!selectedComponent && (
            <>
              {renderComponent('FormCard')}
              {renderComponent('ActionButton')}
              {renderComponent('LoadingSkeleton')}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCommonPage;
