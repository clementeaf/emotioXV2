'use client';

import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface DuplicateResearchButtonProps {
  researchId: string;
  researchName: string;
  className?: string;
  onDuplicateSuccess?: (newResearchId: string) => void;
}

export function DuplicateResearchButton({
  researchId,
  researchName,
  className,
  onDuplicateSuccess
}: DuplicateResearchButtonProps) {
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (isDuplicating) return;

    setIsDuplicating(true);

    try {
      // Duplication logic pending - requires backend endpoint for research.duplicate(id)
      // Currently simulating the process
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay

      toast.success(`Investigación "${researchName}" duplicada exitosamente`);

      // Simular nuevo ID
      const newResearchId = `${researchId}-copy-${Date.now()}`;
      onDuplicateSuccess?.(newResearchId);

    } catch (error) {
      toast.error('Error al duplicar la investigación');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDuplicate}
      disabled={isDuplicating}
      className={className}
      title={`Duplicar investigación: ${researchName}`}
    >
      {isDuplicating ? 'Duplicating...' : 'Duplicate'}
    </Button>
  );
}
