import { useMemo } from 'react';
import { ExpandedStep } from '../../types/flow';

export function useAnsweredStepIds(steps: ExpandedStep[], moduleResponsesData: any[]): string[] {
  return useMemo(() => {
    if (!moduleResponsesData || !Array.isArray(moduleResponsesData) || !steps) return [];
    const ids = new Set<string>();
    moduleResponsesData.forEach((response) => {
      const matchedStep = steps.find(
        (s: ExpandedStep) =>
          (s.type === response.stepType) ||
          (s.name === response.stepTitle)
      );
      if (matchedStep) {
        ids.add(matchedStep.id);
      }
    });
    return Array.from(ids);
  }, [moduleResponsesData, steps]);
} 