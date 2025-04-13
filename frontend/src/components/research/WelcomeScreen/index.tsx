import React from 'react';
import { WelcomeScreenFormProps } from './types';
import { useWelcomeScreenForm } from './hooks/useWelcomeScreenForm';
import { WelcomeScreenHeader } from './components/WelcomeScreenHeader';
import { WelcomeScreenToggle } from './components/WelcomeScreenToggle';
import { WelcomeScreenFields } from './components/WelcomeScreenFields';
import { WelcomeScreenFooter } from './components/WelcomeScreenFooter';
import { ErrorModal } from './components/ErrorModal';
import { JsonPreviewModal } from './components/JsonPreviewModal';
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
    isLoading,
    isSaving,
    validationErrors,
    modalError,
    isExisting,
    handleChange,
    handleSave,
    validateForm,
    showJsonPreview,
    closeJsonModal,
    jsonToSend,
    pendingAction,
    continueWithAction
  } = useWelcomeScreenForm(researchId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
      <WelcomeScreenHeader 
        title={isExisting ? "Editar Pantalla de Bienvenida" : "Nueva Pantalla de Bienvenida"}
        description={isExisting 
          ? "Modifica la configuración de la pantalla de bienvenida existente" 
          : "Configura una nueva pantalla de bienvenida para tu investigación"
        }
      />

      <WelcomeScreenToggle 
        isEnabled={formData.isEnabled}
        onChange={(enabled) => handleChange('isEnabled', enabled)}
        disabled={isSaving}
      />

      <WelcomeScreenFields 
        formData={formData}
        onChange={handleChange}
        validationErrors={validationErrors}
        disabled={isSaving}
      />

      <WelcomeScreenFooter 
        onSave={handleSave}
        isSaving={isSaving}
        buttonText={isExisting ? "Actualizar" : "Guardar"}
      />

      {modalError && (
        <ErrorModal
          title={modalError.title}
          message={modalError.message}
          type={modalError.type}
          onClose={() => handleChange('modalError', null)}
        />
      )}

      {/* Modal para la vista previa del JSON */}
      <JsonPreviewModal
        isOpen={showJsonPreview}
        onClose={closeJsonModal}
        onContinue={continueWithAction}
        jsonData={jsonToSend}
        pendingAction={pendingAction}
      />
    </div>
  );
}; 