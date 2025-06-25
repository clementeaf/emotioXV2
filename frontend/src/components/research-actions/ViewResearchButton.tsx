'use client';

import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface ViewResearchButtonProps {
  researchId: string;
  researchName: string;
  className?: string;
}

export function ViewResearchButton({ researchId, researchName, className }: ViewResearchButtonProps) {
  const router = useRouter();

  const handleView = () => {
    // Navegar a la página de investigación específica
    router.push(`/research/${researchId}`);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleView}
      className={className}
      title={`Ver investigación: ${researchName}`}
    >
      View
    </Button>
  );
}
