'use client';

import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

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

    try {
      // Por ahora, simular la eliminación
      // TODO: Implementar lógica real de eliminación cuando la API esté lista
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay

      toast.success(`Investigación "${researchName}" eliminada exitosamente`);

      // Notificar al componente padre
      onDeleteSuccess?.(researchId);

    } catch (error) {
      console.error('Error deleting research:', error);
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
