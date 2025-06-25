'use client';

import { DeleteResearchButton } from './DeleteResearchButton';
import { DuplicateResearchButton } from './DuplicateResearchButton';
import { ViewResearchButton } from './ViewResearchButton';

interface ResearchActionsProps {
  researchId: string;
  researchName: string;
  className?: string;
  onDuplicateSuccess?: (newResearchId: string) => void;
  onDeleteSuccess?: (deletedResearchId: string) => void;
}

export function ResearchActions({
  researchId,
  researchName,
  className,
  onDuplicateSuccess,
  onDeleteSuccess
}: ResearchActionsProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <ViewResearchButton
        researchId={researchId}
        researchName={researchName}
      />
      <DuplicateResearchButton
        researchId={researchId}
        researchName={researchName}
        onDuplicateSuccess={onDuplicateSuccess}
      />
      <DeleteResearchButton
        researchId={researchId}
        researchName={researchName}
        onDeleteSuccess={onDeleteSuccess}
      />
    </div>
  );
}
