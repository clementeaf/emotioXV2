'use client';

import React from 'react';
import { Save, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { ErrorModal } from '@/components/common/ErrorModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useScreenerForm } from './hooks/useScreenerForm';

interface ScreenerFormProps {
  researchId: string;
}

export const ScreenerForm: React.FC<ScreenerFormProps> = ({ researchId }) => {
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
    closeDeleteModal
  } = useScreenerForm(researchId);

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
            <h3 className="text-lg font-medium text-gray-900">Screener</h3>
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
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ingresa el título del screener"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Ingresa la descripción del screener"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {validationErrors.description && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* Questions placeholder */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600">
              La gestión de preguntas del screener estará disponible próximamente.
            </p>
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
        title="Eliminar Screener"
        message="¿Estás seguro de que quieres eliminar la configuración de Screener? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
