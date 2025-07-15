import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { UseDeleteStateProps, UseDeleteStateReturn } from './types';

export const useDeleteState = ({
  onSuccess,
  buttonText = 'Limpiar todas las respuestas'
}: UseDeleteStateProps): UseDeleteStateReturn => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (deleteFn: () => Promise<void>) => {
    setIsDeleting(true);

    try {
      await deleteFn();
      toast.success('Todas las respuestas eliminadas exitosamente');

      if (onSuccess) onSuccess();
      console.log('[useDeleteState] Respuestas eliminadas exitosamente');

    } catch (error) {
      console.error('[useDeleteState] ❌ Error:', error);
      toast.error('Error al eliminar respuestas');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    buttonText: isDeleting ? 'Eliminando...' : buttonText,
    isButtonDisabled: isDeleting,
    handleDelete
  };
};
