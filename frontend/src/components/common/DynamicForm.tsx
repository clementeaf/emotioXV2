import React, { useCallback, useState } from 'react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { NavigationColumn } from '@/components/common/NavigationColumn';
import { FormColumn } from '@/components/common/FormColumn';
import { PreviewColumn } from '@/components/common/PreviewColumn';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { ErrorModal } from '@/components/common/ErrorModal';
// import { FormFooter } from '@/components/common/FormFooter'; // Reemplazado por GlobalActionButtons
import { useFormManager } from '@/hooks/useFormManager';
import { InfoTooltip, QuestionSaveButton, FormNavigation, GlobalActionButtons } from '@/components/common/atomic';
import { SMARTVOC_INFO, COGNITIVE_TASK_INFO } from '@/utils/info-content';

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
    closeDeleteModal,
    updateQuestion,
    saveQuestion,
    modifiedQuestions
  } = useFormManager(questionKey, researchId);

  const questions = formData.questions || [];

  // Funciones de navegación
  const handlePrevious = useCallback(() => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  }, [activeQuestionIndex]);

  const handleNext = useCallback(() => {
    if (activeQuestionIndex < questions.length - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    }
  }, [activeQuestionIndex, questions.length]);

  // Seleccionar contenido informativo basado en questionKey
  const getInfoContent = () => {
    if (questionKey === 'smartvoc') return SMARTVOC_INFO;
    if (questionKey === 'cognitive_task') return COGNITIVE_TASK_INFO;
    return null;
  };

  const infoContent = getInfoContent();

  // Object mapping para renderers de vista previa - más escalable que switch case
  const PREVIEW_RENDERERS = {
    short_text: (question: any) => (
      <div>
        <input
          type="text"
          placeholder={question.answerPlaceholder || 'Escribe tu respuesta aquí...'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled
        />
      </div>
    ),
    long_text: (question: any) => (
      <div>
        <textarea
          placeholder={question.answerPlaceholder || 'Escribe tu respuesta aquí...'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          disabled
        />
      </div>
    ),
    single_choice: (question: any) => (
      <div className="space-y-2">
        {(question.choices || []).map((choice: any, index: number) => (
          <label key={index} className="flex items-center space-x-2">
            <input
              type="radio"
              name={`preview-${question.id}`}
              className="text-blue-600 focus:ring-blue-500"
              disabled
            />
            <span className="text-sm text-gray-700">{choice.text || `Opción ${index + 1}`}</span>
          </label>
        ))}
      </div>
    ),
    multiple_choice: (question: any) => (
      <div className="space-y-2">
        {(question.choices || []).map((choice: any, index: number) => (
          <label key={index} className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="text-blue-600 focus:ring-blue-500 rounded"
              disabled
            />
            <span className="text-sm text-gray-700">{choice.text || `Opción ${index + 1}`}</span>
          </label>
        ))}
      </div>
    ),
    linear_scale: (question: any) => (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{question.minLabel || 'Mínimo'}</span>
          <span>{question.maxLabel || 'Máximo'}</span>
        </div>
        <input
          type="range"
          min={question.minValue || 1}
          max={question.maxValue || 5}
          className="w-full"
          disabled
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{question.minValue || 1}</span>
          <span>{question.maxValue || 5}</span>
        </div>
      </div>
    ),
    file_upload: (question: any) => (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="space-y-2">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-600">Arrastra archivos aquí o haz clic para seleccionar</p>
          <p className="text-xs text-gray-500">{question.acceptedTypes || 'Todos los tipos'}</p>
        </div>
      </div>
    ),
    ranking: (question: any) => (
      <div className="space-y-2">
        {(question.choices || []).map((choice: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded">
            <span className="text-sm font-medium text-gray-500">{index + 1}</span>
            <span className="text-sm text-gray-700">{choice.text || `Opción ${index + 1}`}</span>
          </div>
        ))}
      </div>
    ),
    preference_test: (question: any) => (
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-1 text-xs">Imagen A</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-1 text-xs">Imagen B</p>
          </div>
        </div>
      </div>
    )
  } as const;

  type PreviewType = keyof typeof PREVIEW_RENDERERS;

  // Función para renderizar vista previa según el tipo de pregunta
  const renderPreviewByType = (question: any) => {
    const PreviewRenderer = PREVIEW_RENDERERS[question.type as PreviewType];
    
    if (!PreviewRenderer) {
      return (
        <div className="text-gray-500 text-sm">
          Vista previa no disponible para este tipo de pregunta
        </div>
      );
    }
    
    return PreviewRenderer(question);
  };

  // Función legacy eliminada - ahora usamos object mapping

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
      <div className='flex flex-col justify-between h-[920px]'>
        <div className='flex gap-4'>
          {/* Columna izquierda - Navegación */}
          <NavigationColumn
            title={
              <div className="flex items-center gap-2">
                {title}
                {infoContent && (
                  <InfoTooltip
                    title={infoContent.title}
                    content={infoContent.content}
                    position="bottom"
                  />
                )}
              </div>
            }
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
              navigation={
                <FormNavigation
                  currentIndex={activeQuestionIndex}
                  totalItems={questions.length}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                />
              }
            >
              {(() => {
                const question = questions[activeQuestionIndex];
                const schema = getSchema(question.id);

                if (!schema) return null;

                const isModified = modifiedQuestions.includes(question.id);

                return (
                  <div className="space-y-4">
                    <FieldMapper
                      fields={schema.fields}
                      question={question}
                      updateQuestion={updateQuestion}
                    />
                    
                    {/* Botón granular para esta pregunta */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <QuestionSaveButton
                        questionId={question.id}
                        onSave={saveQuestion}
                        isModified={isModified}
                        isSaving={isSaving}
                        hasExistingData={isExisting}
                        className="px-4 py-2"
                      />
                    </div>
                  </div>
                );
              })()}
            </FormColumn>
          )}

          {/* Columna derecha - Vista previa */}
          {questions[activeQuestionIndex] && (
            <PreviewColumn
              title="Vista Previa"
              subtitle="Así verán esta pregunta los participantes (NO EDITABLE)"
            >
              {(() => {
                const question = questions[activeQuestionIndex];
                const schema = getSchema(question.id);

                if (!schema) return null;

                // Renderizar vista previa basada en el tipo de pregunta
                return (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                      {/* Título de la pregunta */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {question.title || 'Título de la pregunta'}
                      </h3>
                      
                      {/* Descripción */}
                      {question.description && (
                        <p className="text-gray-600 text-sm mb-4">
                          {question.description}
                        </p>
                      )}

                      {/* Instrucciones */}
                      {question.instructions && (
                        <p className="text-gray-500 text-xs mb-4 bg-blue-50 p-2 rounded">
                          {question.instructions}
                        </p>
                      )}

                      {/* Renderizar vista previa según el tipo */}
                      <div className="mt-4">
                        {renderPreviewByType(question)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </PreviewColumn>
          )}

        </div>
        <GlobalActionButtons
          isSaving={isSaving}
          isLoading={isLoading}
          onSave={handleSaveAndNotify}
          onPreview={handlePreview}
          onDelete={handleDelete}
          isExisting={isExisting}
          deleteText={`Eliminar todo ${title}`}
          className="mt-6"
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
