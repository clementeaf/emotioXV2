import { Info } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

import { ErrorModalData } from '../types';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
}

/**
 * Componente para mostrar errores y mensajes en un modal
 */
export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, error }) => {
  if (!error) {return null;}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-blue-50">
        <DialogHeader className="flex flex-row items-center space-x-3">
          <Info className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <DialogTitle className="text-lg font-medium text-blue-600">{error.title}</DialogTitle>
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