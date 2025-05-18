import { useMemo } from 'react';
import { ExpandedStep } from '../../types/flow';

export function useAnsweredStepIds(steps: ExpandedStep[], moduleResponsesData: unknown[]): string[] {
  return useMemo(() => {
    if (!moduleResponsesData || !Array.isArray(moduleResponsesData) || !steps) return [];
    const ids = new Set<string>();
    moduleResponsesData.forEach((response) => {
      if (typeof response !== 'object' || response === null) return;
      const resp = response as { stepType?: string; stepTitle?: string };
      const matchedStep = steps.find(
        (s: ExpandedStep) =>
          (s.type === resp.stepType) ||
          (s.name === resp.stepTitle)
      );
      if (matchedStep) {
        ids.add(matchedStep.id);
      }
    });
    return Array.from(ids);
  }, [moduleResponsesData, steps]);
} 