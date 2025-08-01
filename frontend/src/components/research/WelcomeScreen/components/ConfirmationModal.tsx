import React from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { WelcomeScreenFormData as WelcomeScreenData } from '../../../../../../shared/interfaces/welcome-screen.interface';


interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data?: WelcomeScreenData | null;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, data }) => {
  if (!isOpen) { return null; }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Guardado</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres guardar los cambios en la pantalla de bienvenida?
            {data && (
              <div className="mt-4 text-xs text-neutral-600 bg-neutral-100 p-2 rounded">
                <p><strong>Título:</strong> {data.title}</p>
                <p><strong>Mensaje:</strong> {(data.message || '').substring(0, 50)}...</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-3 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm}>Confirmar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
