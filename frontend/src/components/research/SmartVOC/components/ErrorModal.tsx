import React from 'react';
import { ErrorModalProps } from '../types';
import { UI_TEXTS } from '../constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Componente para mostrar errores y mensajes en un modal
 */
export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  error
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
      default: return UI_TEXTS.MODAL.ERROR_TITLE;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-blue-50">
        <DialogHeader className="flex flex-row items-center space-x-3">
          <Info className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <DialogTitle className="text-lg font-medium text-blue-600">{getTitle()}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-2 text-sm text-blue-600">
          {typeof error.message === 'string' ? error.message : null}
        </DialogDescription>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 