'use client';

import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { researchAPI } from '@/config/api-client';

interface DeleteResearchButtonProps {
  researchId: string;
  researchName: string;
  className?: string;
  onDeleteSuccess?: (deletedResearchId: string) => void;
}

export function DeleteResearchButton({
  researchId,
  researchName,
  className,
  onDeleteSuccess
}: DeleteResearchButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    // Confirmar antes de eliminar
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la investigación "${researchName}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    // Notificar al componente padre INMEDIATAMENTE para actualización optimista
    onDeleteSuccess?.(researchId);

    try {
      // Eliminar la investigación usando la API
      const result = await researchAPI.delete(researchId);

      if (result.success) {
        toast.success(`Investigación "${researchName}" eliminada exitosamente`);
      } else {
        throw new Error(result.error || 'Error al eliminar la investigación');
      }
    } catch (error) {
      // Si falla la API, revertir sería ideal pero por ahora solo mostramos error
      toast.error('Error al eliminar la investigación');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className={`text-red-600 hover:text-red-900 hover:bg-red-50 ${className || ''}`}
      title={`Eliminar investigación: ${researchName}`}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
