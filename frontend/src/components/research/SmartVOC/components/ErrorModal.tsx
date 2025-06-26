import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

import { UI_TEXTS } from '../constants';
import { ErrorModalProps } from '../types';

/**
 * Componente para mostrar errores y mensajes en un modal
 */
export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  error,
  onConfirm
}) => {
  if (!isOpen || !error) {
    return null;
  }

  // Determinar el título según el tipo
  const getTitle = () => {
    switch (error.type) {
      case 'error': return UI_TEXTS.MODAL.ERROR_TITLE;
      case 'info': return UI_TEXTS.MODAL.INFO_TITLE;
      case 'success': return UI_TEXTS.MODAL.SUCCESS_TITLE;
      case 'warning': return UI_TEXTS.MODAL.WARNING_TITLE;
      default: return UI_TEXTS.MODAL.ERROR_TITLE;
    }
  };

  const iconMap = {
    error: <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />,
    success: <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />,
    info: <Info className="h-6 w-6 text-blue-600" aria-hidden="true" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" aria-hidden="true" />
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-blue-50">
        <DialogHeader className="flex flex-row items-center space-x-3">
          {iconMap[error.type]}
          <DialogTitle className="text-lg font-medium text-blue-600">{getTitle()}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-2 text-sm text-blue-600">
          {typeof error.message === 'string' ? error.message : null}
        </DialogDescription>
        <div className="mt-4 flex justify-end">
          {onConfirm ? (
            <>
              <Button variant="outline" onClick={() => {
                onConfirm();
                onClose();
              }}>Confirmar</Button>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>{UI_TEXTS.BUTTONS.ACCEPT}</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
