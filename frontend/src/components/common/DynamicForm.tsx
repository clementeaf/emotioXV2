import React, { useCallback, useState } from 'react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EducationalSidebar } from '@/components/common/EducationalSidebar';
import { NavigationColumn } from '@/components/common/NavigationColumn';
import { FormColumn } from '@/components/common/FormColumn';
import { useEducationalContent } from '@/hooks/useEducationalContent';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { ErrorModal } from '@/components/common/ErrorModal';
import { FormFooter } from '@/components/common/FormFooter';
import { useFormManager } from '@/hooks/useFormManager';

interface DynamicFormProps {
  className?: string;
  questionKey: string;
  getSchema: (id: string) => any;
  title: string;
  contentKey: string;
  researchId: string;
  onSave?: (data: any) => void;
  estimatedCompletionTime?: string;
  FieldMapper: React.ComponentType<{
    fields: any[];
    question: any;
    updateQuestion: (field: string, value: any) => void;
  }>;
}

/**
 * Componente genérico para formularios dinámicos
 * Reutilizable para SmartVOC, Cognitive Task, y otros formularios
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({
  className,
  questionKey,
  getSchema,
  title,
  contentKey,
  researchId,
  onSave,
  estimatedCompletionTime = '5-10',
  FieldMapper
}) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Use the universal form manager hook
  const {
    formData,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleSave,
    handlePreview,
    handleDelete,
    closeModal,
    isExisting,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal
  } = useFormManager(questionKey, researchId);

  const questions = formData.questions || [];

  // Hook para el contenido educativo
  const {
    smartVocContent,
    cognitiveTaskContent,
    loading: educationalLoading,
    error: educationalError
  } = useEducationalContent();

  // Seleccionar contenido basado en contentKey
  const educationalContent = contentKey === 'smartVocContent' ? smartVocContent : cognitiveTaskContent;

  // Callback para guardar y notificar al componente padre si es necesario
  const handleSaveAndNotify = useCallback(() => {
    handleSave();
    if (onSave) {
      const metadataToSend = {
        createdAt: new Date().toISOString(),
        estimatedCompletionTime,
        ...(formData.metadata || {}),
      };

      onSave({
        ...formData,
        questions,
        metadata: metadataToSend as {
          createdAt: string;
          updatedAt?: string;
          estimatedCompletionTime: string;
        },
      });
    }
  }, [handleSave, onSave, formData, questions, estimatedCompletionTime]);

  if (isLoading) {
    return (
      <div className={className}>
        <LoadingSkeleton type="form" count={4} />
      </div>
    );
  }

  // Procesar items de navegación basado en schema dinámico
  const navigationItems = questions.map((question: { id: string; title?: string }) => {
    const schema = getSchema(question.id);
    return {
      id: question.id,
      title: schema?.displayName || question.id,
      subtitle: question.title || 'Sin título'
    };
  });

  return (
    <div className="flex">
      <div className='flex flex-col justify-between h-[650px]'>
        <div className='flex gap-4'>
          {/* Columna izquierda - Navegación */}
          <NavigationColumn
            title={title}
            items={navigationItems}
            activeIndex={activeQuestionIndex}
            onItemClick={setActiveQuestionIndex}
            onAddClick={() => {/* TODO: Implementar agregar pregunta */ }}
            addButtonText="+ Agregar pregunta"
            getItemName={(id: string) => {
              const schema = getSchema(id);
              return schema?.displayName || id;
            }}
          />

          {/* Columna central - Pregunta activa */}
          {questions[activeQuestionIndex] && (
            <FormColumn
              title={(() => {
                const schema = getSchema(questions[activeQuestionIndex].id);
                return schema?.displayName || questions[activeQuestionIndex].id;
              })()}
              subtitle={questions[activeQuestionIndex].title || 'Sin título'}
            >
              {(() => {
                const question = questions[activeQuestionIndex];
                const schema = getSchema(question.id);

                if (!schema) return null;

                return (
                  <FieldMapper
                    fields={schema.fields}
                    question={question}
                    updateQuestion={() => {}} // TODO: Implement updateQuestion with useFormManager
                  />
                );
              })()}
            </FormColumn>
          )}

          {/* Columna derecha - Sidebar fijo con contenido educativo */}
          <EducationalSidebar
            content={educationalContent}
            loading={educationalLoading}
            error={educationalError}
            title="Configuración Avanzada"
          />
        </div>
        <FormFooter
          isSaving={isSaving}
          isLoading={isLoading}
          onSave={handleSaveAndNotify}
          onPreview={handlePreview}
          onDelete={handleDelete}
          isExisting={isExisting}
          deleteText={`Eliminar datos ${title}`}
        />
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

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar TODOS los datos ${title} de esta investigación? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};
