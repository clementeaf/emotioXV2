'use client';

import React, { useState } from 'react';
import { Save, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { CustomSelect, Option } from '@/components/ui/CustomSelect';
import { ErrorModal } from '@/components/common/ErrorModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useScreenerForm } from './hooks/useScreenerForm';
import { ScreenerQuestions } from './components/ScreenerQuestions';
import type { ScreenerQuestion } from '@/api/domains/screener/screener.types';

interface ScreenerFormProps {
  researchId: string;
}

const QUESTION_TYPES: Option[] = [
  { value: 'single_choice', label: 'Single choice' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'linear_scale', label: 'Linear scale' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'navigation_flow', label: 'Navigation flow' },
  { value: 'preference_test', label: 'Preference test' }
];

export const ScreenerForm: React.FC<ScreenerFormProps> = ({ researchId }) => {
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('single_choice');

  const {
    formData,
    isLoading,
    isSaving,
    validationErrors,
    modalError,
    modalVisible,
    isDeleteModalOpen,
    handleChange,
    handleSave,
    handleDelete,
    confirmDelete,
    closeModal,
    closeDeleteModal,
    addQuestion,
    updateQuestion,
    removeQuestion,
    addOption,
    updateOption,
    removeOption
  } = useScreenerForm(researchId);

  const handleAddQuestion = () => {
    if (selectedQuestionType) {
      addQuestion(selectedQuestionType as ScreenerQuestion['questionType']);
      setSelectedQuestionType('single_choice');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Screener</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure the screener questions for this research
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDelete}
            variant="outline"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash className="w-4 h-4" />
            Delete
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Switch de Enabled */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">1.0.- Screener</h3>
            <p className="text-sm text-gray-600">
              Habilitar o deshabilitar el screener para esta investigación
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {formData.isEnabled ? 'Habilitado' : 'Deshabilitado'}
            </span>
            <Switch
              checked={formData.isEnabled}
              onCheckedChange={(checked) => handleChange('isEnabled', checked)}
              aria-label="Habilitar screener"
            />
          </div>
        </div>
      </div>

      {/* Contenido de configuración */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Screener
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ingresa el título del screener"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <CustomSelect
                value={selectedQuestionType}
                onChange={setSelectedQuestionType}
                options={QUESTION_TYPES}
                placeholder="Selecciona el tipo"
                disabled={isSaving}
                className="w-[140px]"
              />
              <Button
                onClick={handleAddQuestion}
                disabled={isSaving || !selectedQuestionType}
                className="whitespace-nowrap"
              >
                + Añadir Pregunta
              </Button>
            </div>
            {validationErrors.title && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Ingresa la descripción del screener"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {validationErrors.description && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* Questions Management */}
          <div className="border-t pt-6">
            <ScreenerQuestions
              questions={formData.questions}
              onUpdateQuestion={updateQuestion}
              onRemoveQuestion={removeQuestion}
              onAddOption={addOption}
              onUpdateOption={updateOption}
              onRemoveOption={removeOption}
              disabled={isSaving}
            />
          </div>

          {/* Randomize Questions Checkbox */}

        </div>
      </div>

      {/* Error Modal */}
      {modalError && (
        <ErrorModal
          isOpen={modalVisible}
          onClose={closeModal}
          error={modalError}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Eliminar Screener"
        message="¿Estás seguro de que quieres eliminar la configuración de Screener? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
