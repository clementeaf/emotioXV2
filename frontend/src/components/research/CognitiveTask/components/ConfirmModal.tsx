import React from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/Dialog';
import { Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean; // Para mostrar estado de carga
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isConfirming = false,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-4 flex justify-end space-x-2">
          <Button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            variant="outline"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 