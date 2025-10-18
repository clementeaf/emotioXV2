import React from 'react';
import { Button } from '../../commons';
import type { SuccessSectionProps } from '../../../types/research-creation.interface';

/**
 * Sección de investigación exitosa
 */
export const SuccessSection: React.FC<SuccessSectionProps> = ({ id, name, onClose }) => (
  <div className="space-y-6">
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Investigación Creada
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Tu investigación ha sido creada exitosamente
      </p>
    </div>

    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-green-600 text-lg">✓</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-800">{name}</h3>
          <p className="text-sm text-green-600">ID: {id}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-green-700">
          La investigación ha sido creada exitosamente y está lista para ser configurada.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Ir a la Investigación
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-600 text-white hover:bg-gray-700"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </div>
  </div>
);
