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
  className,
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
    console.log('Toggle cambiado a:', checked);
    handleChange('isEnabled', checked);
  };
  
  // Asegurarnos de que siempre pasemos valores seguros a los componentes hijos
  const safeFormData = {
    ...DEFAULT_WELCOME_SCREEN_CONFIG, // Valores por defecto
    ...formData // Datos reales (pueden tener campos null/undefined)
  };
  
  // Determinar si el botón debería mostrar "Guardar" o "Actualizar"
  const isNewConfig = !welcomeScreenId;
  const buttonText = isNewConfig 
    ? UI_TEXTS.BUTTONS.SAVE  // "Guardar configuración"
    : UI_TEXTS.BUTTONS.UPDATE; // "Actualizar configuración"
  
  console.log('Estado actual del formulario:', {
    welcomeScreenId,
    isEnabled: safeFormData.isEnabled,
    isNewConfig,
    buttonText
  });
  
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

      {/* Indicador de estado - Solo para debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
          <p>Estado: {isNewConfig ? 'Nueva configuración' : 'Configuración existente'}</p>
          <p>ID: {welcomeScreenId || 'No hay ID (nueva)'}</p>
          <p>Habilitada: {safeFormData.isEnabled ? 'Sí' : 'No'}</p>
        </div>
      )}
      
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
      
      {/* Pie de página con acciones - Forzamos usar el texto de botón calculado aquí */}
      <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isLoading || isSaving || !safeFormData.isEnabled}
          className={`px-4 py-2 text-sm font-medium rounded-md border border-blue-600 text-blue-600 
            hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${(isLoading || isSaving || !safeFormData.isEnabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {UI_TEXTS.BUTTONS.PREVIEW}
        </button>
        
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className={`px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white 
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${(isLoading || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? UI_TEXTS.BUTTONS.SAVING : (isNewConfig ? UI_TEXTS.BUTTONS.SAVE : UI_TEXTS.BUTTONS.UPDATE)}
        </button>
      </div>

      {/* Modal para mostrar errores y mensajes */}
      <ErrorModal 
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />
    </div>
  );
}; 