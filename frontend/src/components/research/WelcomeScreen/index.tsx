import React from 'react';
import { WelcomeScreenFormProps, DEFAULT_WELCOME_SCREEN_CONFIG } from './types';
import { useWelcomeScreenForm } from './hooks/useWelcomeScreenForm';
import { WelcomeScreenHeader } from './components/WelcomeScreenHeader';
import { WelcomeScreenToggle } from './components/WelcomeScreenToggle';
import { WelcomeScreenFields } from './components/WelcomeScreenFields';
import { WelcomeScreenFooter } from './components/WelcomeScreenFooter';
import { ErrorModal } from './components/ErrorModal';
import { UI_TEXTS } from './constants';

/**
 * Componente principal del formulario de pantalla de bienvenida
 * Esta versión refactorizada separa las responsabilidades en subcomponentes
 * y utiliza un hook personalizado para la lógica del formulario
 */
export const WelcomeScreenForm: React.FC<WelcomeScreenFormProps> = ({ 
  className = '', 
  researchId 
}) => {
  const {
    formData,
    welcomeScreenId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleChange,
    handleSave,
    handlePreview,
    validateForm,
    closeModal
  } = useWelcomeScreenForm(researchId);

  // Manejar cambio en el toggle
  const handleToggleChange = (checked: boolean) => {
    handleChange('isEnabled', checked);
  };
  
  // Asegurarnos de que siempre pasemos valores seguros a los componentes hijos
  const safeFormData = {
    ...DEFAULT_WELCOME_SCREEN_CONFIG, // Valores por defecto
    ...formData // Datos reales (pueden tener campos null/undefined)
  };
  
  // Mientras carga, mostrar un indicador de carga
  if (isLoading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm ${className} flex flex-col items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
          <div className="space-y-2 w-full">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="space-y-2 w-full">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-24 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="flex justify-end space-x-2 w-full">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-blue-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
      {/* Encabezado */}
      <WelcomeScreenHeader 
        title={UI_TEXTS.TITLE} 
        description={UI_TEXTS.DESCRIPTION}
      />
      
      {/* Función principal de toggle */}
      <WelcomeScreenToggle 
        isEnabled={safeFormData.isEnabled}
        onChange={handleToggleChange}
        disabled={isLoading || isSaving}
      />
      
      {/* Campos del formulario */}
      <WelcomeScreenFields 
        formData={safeFormData}
        onChange={handleChange}
        validationErrors={validationErrors || {}}
        disabled={isLoading || isSaving}
      />
      
      {/* Pie de página con acciones */}
      <WelcomeScreenFooter 
        isSaving={isSaving}
        isLoading={isLoading}
        welcomeScreenId={welcomeScreenId}
        isEnabled={safeFormData.isEnabled}
        onSave={handleSave}
        onPreview={handlePreview}
      />

      {/* Modal para mostrar errores y mensajes */}
      <ErrorModal 
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />
    </div>
  );
}; 