import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useDynamicQuestionForm } from '../hooks/useDynamicQuestionForm';
import { useEducationalContent } from '@/hooks/useEducationalContent';
import { DynamicQuestionRenderer } from './DynamicQuestionRenderer';
import { EducationalSidebar } from '@/components/common/EducationalSidebar';
import { ErrorModal } from '@/components/common/ErrorModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { Plus, Save, Eye, Trash2, FileText, Loader2 } from 'lucide-react';
import { AddQuestionModal } from '@/components/common';

interface DynamicQuestionFormProps {
  moduleType: 'smart-voc' | 'cognitive-task' | 'eye-tracking';
  researchId: string;
  className?: string;
  onSave?: (data: any) => void;
  educationalContentKey?: string;
}

/**
 * Componente principal genérico para formularios de preguntas
 * Funciona con cualquier módulo usando configuración dinámica
 */
export const DynamicQuestionForm: React.FC<DynamicQuestionFormProps> = ({
  moduleType,
  researchId,
  className,
  onSave,
  educationalContentKey = 'smartVocContent'
}) => {
  const {
    formData,
    questions,
    isLoading,
    isSaving,
    validationErrors,
    modalError,
    modalVisible,
    isDeleteModalOpen,
    isExisting,
    moduleConfig,
    availableQuestionTypes,
    addQuestion,
    updateQuestion,
    removeQuestion,
    duplicateQuestion,
    reorderQuestions,
    handleSave,
    handlePreview,
    handleDelete,
    closeModal,
    confirmDelete,
    closeDeleteModal,
    getQuestionTypeConfig,
    isEmpty
  } = useDynamicQuestionForm(moduleType, researchId, onSave);

  // Sistema genérico funcionando correctamente

  // Hook para contenido educativo
  const educationalData = useEducationalContent();
  const educationalContent = educationalData[educationalContentKey as keyof typeof educationalData] as any;
  const educationalLoading = educationalData.loading;
  const educationalError = educationalData.error;

  // Estado local para modal de agregar pregunta
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Callback para guardar y notificar al componente padre
  const handleSaveAndNotify = async () => {
    await handleSave();
    if (onSave) {
      onSave(formData);
    }
  };

  // Mientras carga, mostrar skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex gap-6 min-w-[1200px]">
        {/* Columna izquierda - Contenido principal con scroll */}
        <div className="flex-[2] min-w-[800px] max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
          {/* Header con título y botón agregar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Configuración de {moduleConfig.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {moduleConfig.description}
                </p>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Pregunta
              </Button>
            </div>
          </div>

          {/* Lista de preguntas */}
          {isEmpty ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay preguntas configuradas
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza agregando tu primera pregunta
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Primera Pregunta
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => 
                getQuestionTypeConfig(question.type) ? (
                  <DynamicQuestionRenderer
                    key={question.id}
                    question={question}
                    questionTypeConfig={getQuestionTypeConfig(question.type)!}
                    onUpdate={(updates) => updateQuestion(question.id, updates)}
                    onRemove={() => removeQuestion(question.id)}
                    disabled={isLoading || isSaving}
                  />
                ) : null
              )}
            </div>
          )}
          
          {/* Pie de página con acciones */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={isLoading || isSaving}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Vista Previa
                </Button>
                <Button
                  onClick={handleSaveAndNotify}
                  disabled={isLoading || isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isLoading || isSaving}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>

        {/* Columna derecha - Sidebar fijo con contenido educativo */}
        <div className="flex-[1] min-w-[400px]">
          <div className="sticky top-6">
            <EducationalSidebar
              content={educationalContent}
              loading={educationalLoading}
              error={educationalError}
              title={`Configuración ${moduleConfig.name}`}
            />
          </div>
        </div>

        {/* Modales */}
        {modalError && (
          <ErrorModal
            isOpen={modalVisible}
            onClose={closeModal}
            error={{
              type: modalError.type === 'success' ? 'info' : modalError.type,
              title: modalError.title,
              message: typeof modalError.message === 'string' ? modalError.message : String(modalError.message)
            }}
          />
        )}

        <AddQuestionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddQuestion={addQuestion}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que quieres eliminar TODOS los datos de ${moduleConfig.name} de esta investigación? Esta acción no se puede deshacer.`}
        />
      </div>
    </div>
  );
};