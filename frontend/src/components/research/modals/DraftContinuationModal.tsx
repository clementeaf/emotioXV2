import { memo } from 'react';

import { Button } from '@/components/ui/Button';

import { ConfirmationModalProps } from '../../../../../../shared/interfaces/research-creation.interface';

/**
 * Modal de continuación de borrador
 */
export const DraftContinuationModal = memo<ConfirmationModalProps>(({ isOpen, onClose, onContinue, onNew }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Cabecera con fondo de color */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <h2 className="text-xl font-semibold text-neutral-900">
              Borrador de investigación encontrado
            </h2>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          <p className="text-neutral-700 mb-6 leading-relaxed">
            Tienes un borrador de investigación sin completar. ¿Deseas continuar con el borrador existente o iniciar uno nuevo?
          </p>

          {/* Botones principales */}
          <div className="space-y-3">
            <Button
              onClick={onContinue}
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Continuar con el borrador</span>
            </Button>

            <Button
              onClick={onNew}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Crear nuevo borrador</span>
            </Button>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-3">
          <button
            onClick={onClose}
            className="w-full text-center text-neutral-600 hover:text-neutral-900 text-sm py-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});

DraftContinuationModal.displayName = 'DraftContinuationModal';
