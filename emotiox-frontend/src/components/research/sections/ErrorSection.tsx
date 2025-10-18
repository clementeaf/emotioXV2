import React from 'react';
import { Button } from '../../commons';
import type { ErrorSectionProps } from '../../../types/research-creation.interface';

/**
 * Sección de error para pasos no válidos
 */
export const ErrorSection: React.FC<ErrorSectionProps> = ({ onNavigateToStart }) => (
  <div className="p-6 bg-red-50 rounded-lg border border-red-200">
    <h2 className="text-xl font-medium text-red-800 mb-2">Paso no válido</h2>
    <p className="text-red-700 mb-4">
      El paso especificado no es válido. Por favor, regresa al inicio del proceso.
    </p>
    <Button
      onClick={onNavigateToStart}
      className="bg-red-600 text-white hover:bg-red-700"
    >
      Volver al inicio
    </Button>
  </div>
);
