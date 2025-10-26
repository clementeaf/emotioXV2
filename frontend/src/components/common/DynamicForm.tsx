import React, { useCallback, useState } from 'react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { NavigationColumn } from '@/components/common/NavigationColumn';
import { FormColumn } from '@/components/common/FormColumn';
import { PreviewColumn } from '@/components/common/PreviewColumn';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { ErrorModal } from '@/components/common/ErrorModal';
import { FormFooter } from '@/components/common/FormFooter';
import { useFormManager } from '@/hooks/useFormManager';
import { InfoTooltip } from '@/components/common/atomic';
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
    updateQuestion
  } = useFormManager(questionKey, researchId);

  const questions = formData.questions || [];

  // Seleccionar contenido informativo basado en questionKey
  const getInfoContent = () => {
    if (questionKey === 'smartvoc') return SMARTVOC_INFO;
    if (questionKey === 'cognitive_task') return COGNITIVE_TASK_INFO;
    return null;
  };

  const infoContent = getInfoContent();

  // Función para renderizar vista previa según el tipo de pregunta
  const renderPreviewByType = (question: any) => {
    switch (question.type) {
      case 'short_text':
        return (
          <div>
            <input
              type="text"
              placeholder={question.answerPlaceholder || 'Escribe tu respuesta aquí...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
        );

      case 'long_text':
        return (
          <div>
            <textarea
              placeholder={question.answerPlaceholder || 'Escribe tu respuesta aquí...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              disabled
            />
          </div>
        );

      case 'single_choice':
        return (
          <div className="space-y-2">
            {(question.choices || []).map((choice: any, index: number) => (
              <label key={choice.id || index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`preview-${question.id}`}
                  className="text-blue-600"
                  disabled
                />
                <span className="text-sm">{choice.text || `Opción ${index + 1}`}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {(question.choices || []).map((choice: any, index: number) => (
              <label key={choice.id || index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="text-blue-600"
                  disabled
                />
                <span className="text-sm">{choice.text || `Opción ${index + 1}`}</span>
              </label>
            ))}
          </div>
        );

      case 'linear_scale':
        const scaleConfig = question.scaleConfig || { startValue: 1, endValue: 5, startLabel: '', endLabel: '' };
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{scaleConfig.startLabel || scaleConfig.startValue}</span>
              <div className="flex space-x-2">
                {Array.from({ length: scaleConfig.endValue - scaleConfig.startValue + 1 }, (_, i) => (
                  <label key={i} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={`preview-scale-${question.id}`}
                      value={scaleConfig.startValue + i}
                      className="text-blue-600"
                      disabled
                    />
                    <span className="text-sm">{scaleConfig.startValue + i}</span>
                  </label>
                ))}
              </div>
              <span className="text-sm text-gray-600">{scaleConfig.endLabel || scaleConfig.endValue}</span>
            </div>
          </div>
        );

      case 'ranking':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Ordena las opciones por preferencia:</p>
            {(question.choices || []).map((choice: any, index: number) => (
              <div key={choice.id || index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                <span className="text-sm font-medium">{index + 1}.</span>
                <span className="text-sm">{choice.text || `Opción ${index + 1}`}</span>
              </div>
            ))}
          </div>
        );

      case 'file_upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm">Arrastra archivos aquí o haz clic para seleccionar</p>
            </div>
          </div>
        );

      case 'preference_test':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-1 text-xs">Imagen A</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-1 text-xs">Imagen B</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-500 text-sm">
            Vista previa no disponible para este tipo de pregunta
          </div>
        );
    }
  };

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
            >
              {(() => {
                const question = questions[activeQuestionIndex];
                const schema = getSchema(question.id);

                if (!schema) return null;

                return (
                  <FieldMapper
                    fields={schema.fields}
                    question={question}
                    updateQuestion={updateQuestion}
                  />
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
