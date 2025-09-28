'use client';

import { Button } from '@/components/ui/Button';
import { useDeleteResearch } from '@/api/domains/research';

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
  const deleteResearchMutation = useDeleteResearch();

  const handleDelete = async () => {
    // Confirmar antes de eliminar
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la investigación "${researchName}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    // Usar el hook optimista
    deleteResearchMutation.mutate(researchId, {
      onSuccess: () => {
        // Notificar al componente padre si es necesario
        onDeleteSuccess?.(researchId);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={deleteResearchMutation.isPending}
      className={`text-red-600 hover:text-red-900 hover:bg-red-50 ${className || ''}`}
      title={`Eliminar investigación: ${researchName}`}
    >
      {deleteResearchMutation.isPending ? 'Eliminando...' : 'Eliminar'}
    </Button>
  );
}
