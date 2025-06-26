import { AlertTriangle, Info, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom'; // Importar createPortal

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

import { UI_TEXTS } from '../constants';
import { ErrorModalProps } from '../types';

/**
 * Componente para mostrar errores y mensajes en un modal, usando Portal.
 */
export const ErrorModal: React.FC<ErrorModalProps> = ({ 
  isOpen, 
  onClose, 
  error 
}) => {
  const [isClient, setIsClient] = useState(false);

  // Asegurarse de que el código solo se ejecute en el cliente para usar document.body
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Si no debe mostrarse, no hay error, o no estamos en el cliente, no renderizar nada
  if (!isOpen || !error || !isClient) {
    return null;
  }

  // Determinar el título según el tipo
  const getModalTitle = () => {
    switch (error.type) {
      case 'error':
        return UI_TEXTS.MODAL.ERROR_TITLE;
      case 'info':
        return UI_TEXTS.MODAL.INFO_TITLE;
      default:
        return error.title || (error.type === 'warning' ? UI_TEXTS.MODAL.INFO_TITLE : UI_TEXTS.MODAL.ERROR_TITLE);
    }
  };

  // Determinar las clases de color según el tipo
  const getColorClasses = () => {
    switch (error.type) {
      case 'error':
        return {
          header: 'bg-red-50 text-red-800',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          icon: 'text-red-500'
        };
      case 'info':
        return {
          header: 'bg-blue-50 text-blue-800',
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          icon: 'text-blue-500'
        };
      case 'warning':
        return {
          header: 'bg-yellow-50 text-yellow-800',
          button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          icon: 'text-yellow-500'
        };
      default:
        return {
          header: 'bg-red-50 text-red-800',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          icon: 'text-red-500'
        };
    }
  };

  const colorClasses = getColorClasses();
  const title = getModalTitle();

  // Función auxiliar para obtener icono y color basado en el tipo de error
  const getModalStyle = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return {
          Icon: XCircle,
          colorClass: 'text-red-600', 
          bgColorClass: 'bg-red-50' 
        };
      case 'warning':
        return {
          Icon: AlertTriangle,
          colorClass: 'text-yellow-600',
          bgColorClass: 'bg-yellow-50'
        };
      case 'info':
      default:
        return {
          Icon: Info,
          colorClass: 'text-blue-600',
          bgColorClass: 'bg-blue-50'
        };
    }
  };

  const { Icon, colorClass: dialogColorClass, bgColorClass: dialogBgColorClass } = getModalStyle(error.type);

  // El JSX del modal que se renderizará en el portal
  const modalContent = (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogBgColorClass}>
        <DialogHeader className="flex flex-row items-center space-x-3">
          <Icon className={`h-6 w-6 ${dialogColorClass}`} aria-hidden="true" />
          <DialogTitle className={`text-lg font-medium ${dialogColorClass}`}>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className={`mt-2 text-sm ${dialogColorClass}`}>
          {error.message}
        </DialogDescription>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Usar createPortal para renderizar el contenido del modal en document.body
  return ReactDOM.createPortal(modalContent, document.body);
}; 