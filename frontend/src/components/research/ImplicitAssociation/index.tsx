'use client';

import React from 'react';
import { Plus, Trash2, Save, Trash } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { CustomSelect, Option } from '@/components/ui/CustomSelect';
import { FileUploadQuestion } from '../CognitiveTask/components/questions/FileUploadQuestion';
import { useImplicitAssociationForm } from './hooks/useImplicitAssociationForm';
import { ErrorModal } from '@/components/common/ErrorModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import type { Question } from '../CognitiveTask/types';
import type { Target } from '@/api/domains/implicit-association/implicit-association.types';

interface ImplicitAssociationFormProps {
  researchId: string;
}

export const ImplicitAssociationForm: React.FC<ImplicitAssociationFormProps> = ({
  researchId
}) => {
  const {
    formData,
    isLoading,
    isSaving,
    validationErrors,
    modalError,
    modalVisible,
    isDeleteModalOpen,
    handleTargetChange,
    handleFileUpload,
    handleFileDelete,
    handleAttributeChange,
    handleAddAttribute,
    handleRemoveAttribute,
    handleIsRequiredChange,
    handleExerciseInstructionsChange,
    handleTestInstructionsChange,
    handleTestConfigurationChange,
    handleShowResultsChange,
    handleSave,
    handleDelete,
    confirmDelete,
    closeModal,
    closeDeleteModal
  } = useImplicitAssociationForm(researchId);

  const testConfigOptions: Option[] = [
    { value: '', label: 'Please select' },
    { value: 'standard', label: 'Standard IAT' },
    { value: 'brief', label: 'Brief IAT' },
    { value: 'single-category', label: 'Single Category IAT' },
    { value: 'custom', label: 'Custom Configuration' }
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">Implicit Association Test</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure the implicit association test for this research
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

      {/* Switch de Required */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Implicit Association Test</h3>
            <p className="text-sm text-gray-600">
              Habilitar o deshabilitar el test de asociación implícita para esta investigación
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {formData.isRequired ? 'Requerido' : 'Opcional'}
            </span>
            <Switch
              checked={formData.isRequired}
              onCheckedChange={handleIsRequiredChange}
              aria-label="Marcar como requerido el test de asociación implícita"
            />
          </div>
        </div>
      </div>

      {/* Contenido de configuración siempre visible */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm text-gray-600 mb-8">
          Our Implicit Association Test is fully automated technology. You just need to do is add objects or attributes to be tested.
        </p>

        {/* Target Objects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {formData.targets.map((target, index) => {
            // Adaptar Target a Question para FileUploadQuestion
            const question: Question = {
              id: target.id,
              type: target.type,
              title: target.title,
              description: target.description,
              required: target.required,
              showConditionally: target.showConditionally,
              deviceFrame: target.deviceFrame,
              files: target.files.map(file => ({
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url,
                s3Key: file.s3Key || ''
              })),
              hitZones: target.hitZones
            };

            return (
              <div key={target.id}>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Target {index + 1}
                </h3>
                <FileUploadQuestion
                  question={question}
                  onQuestionChange={(updates) => {
                    // Adaptar Question updates a Target updates
                    const targetUpdates: Partial<Target> = {
                      ...(updates.title !== undefined && { title: updates.title }),
                      ...(updates.description !== undefined && { description: updates.description }),
                      ...(updates.required !== undefined && { required: updates.required }),
                      ...(updates.showConditionally !== undefined && { showConditionally: updates.showConditionally }),
                      ...(updates.deviceFrame !== undefined && { deviceFrame: updates.deviceFrame }),
                      ...(updates.files !== undefined && {
                        files: updates.files.map(file => ({
                          id: file.id,
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          url: file.url,
                          s3Key: file.s3Key || ''
                        }))
                      }),
                      ...(updates.hitZones !== undefined && { hitZones: updates.hitZones })
                    };
                    handleTargetChange(target.id, targetUpdates);
                  }}
                  onFileUpload={(files) => handleFileUpload(target.id, files)}
                  onFileDelete={(fileId) => handleFileDelete(target.id, fileId)}
                  validationErrors={null}
                  disabled={false}
                  isUploading={false}
                  uploadProgress={0}
                />
              </div>
            );
          })}
        </div>

        {/* Criteria/Attributes Section */}
        <div className="border-t pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Criteria</h3>
              <p className="text-sm text-gray-600">
                You can add attributes that describe your criteria in the best way. Please see the example:
              </p>
            </div>
            <div className="text-sm text-gray-600">
              Priming display time: <span className="font-medium">300ms</span>
            </div>
          </div>

          {/* Attributes Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attribute name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.attributes.map((attribute) => (
                  <tr key={attribute.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {String(attribute.order).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={attribute.name}
                        onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
                        placeholder="Attribute"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {validationErrors[`attribute_${attribute.order - 1}`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors[`attribute_${attribute.order - 1}`]}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Image
                        </span>
                        <button
                          onClick={() => handleRemoveAttribute(attribute.id)}
                          disabled={formData.attributes.length <= 2}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={formData.attributes.length <= 2 ? "Minimum 2 attributes required" : "Delete attribute"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Attribute Button */}
          <div className="mt-4">
            <Button
              onClick={handleAddAttribute}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Attribute
            </Button>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="border-t pt-8 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Instructions</h3>

          {/* Exercise Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise instructions
            </label>
            <Textarea
              value={formData.exerciseInstructions}
              onChange={(e) => handleExerciseInstructionsChange(e.target.value)}
              rows={8}
              className="w-full"
              placeholder="Enter exercise instructions..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.exerciseInstructions.length} / 1000
            </p>
          </div>

          {/* Test Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test instructions
            </label>
            <Textarea
              value={formData.testInstructions}
              onChange={(e) => handleTestInstructionsChange(e.target.value)}
              rows={8}
              className="w-full"
              placeholder="Enter test instructions..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.testInstructions.length} / 1000
            </p>
          </div>
        </div>

        {/* Test Configuration Section */}
        <div className="border-t pt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test configuration
            </label>
            <CustomSelect
              value={formData.testConfiguration}
              onChange={handleTestConfigurationChange}
              options={testConfigOptions}
              placeholder="Please select"
              className="w-full"
            />
            {validationErrors.testConfiguration && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.testConfiguration}</p>
            )}
          </div>

          {/* Show Results Checkbox */}
          <div className="flex items-start space-x-3">
            <input
              id="show-results"
              type="checkbox"
              checked={formData.showResults}
              onChange={(e) => handleShowResultsChange(e.target.checked)}
              className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show-results" className="text-sm text-gray-700">
              Show results to respondents
            </label>
          </div>
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
        title="Eliminar Implicit Association"
        message="¿Estás seguro de que quieres eliminar la configuración de Implicit Association? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
