import { cn } from '../../lib/utils';
import { ProgressSidebarProps } from './types';
import { colors } from './utils';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useParticipantStore } from '../../stores/participantStore';
import { useMemo } from 'react';
import { useLoadResearchFormsConfig } from '../../hooks/useResearchForms';

export function ProgressSidebar({ 
    steps, 
    currentStepIndex, 
    onNavigateToStep,
}: ProgressSidebarProps) {

  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);

  const researchFormsConfig = useLoadResearchFormsConfig(researchId || '');
  console.log('[ProgressSidebar] Resultado de useLoadResearchFormsConfig:', researchFormsConfig?.data?.data);

  const { data: moduleResponsesData } = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId),
  });
  console.log('Steps: ', steps);
  const totalSteps = steps.length;
  const answeredStepIds = useMemo(() => {
    if (!moduleResponsesData || !Array.isArray(moduleResponsesData) || !steps) return [];
    const ids = new Set<string>();
    moduleResponsesData.forEach((response, _respIdx) => {
        if (response && typeof response.stepTitle === 'string') {
            const matchedStep = steps.find(s => s.responseKey === response.stepTitle);
            if (matchedStep) {
                if (!ids.has(matchedStep.id)) {
                    ids.add(matchedStep.id);
                }
            }
        }
    });
    return Array.from(ids);
  }, [moduleResponsesData, steps]);
  
  const completedSteps = answeredStepIds.length;

  const showCounter = typeof completedSteps === 'number' && typeof totalSteps === 'number' && completedSteps >= 0 && totalSteps >= 0;
  let percentage = 0;
  if (showCounter && totalSteps > 0) {
      percentage = Math.round((completedSteps / totalSteps) * 100);
  }

  return (
    <nav 
      aria-label="Progreso del estudio"
      className="w-56 md:w-64 h-screen bg-neutral-50 p-4 md:p-6 border-r border-neutral-200 flex flex-col sticky top-0 shrink-0"
    >
        <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-semibold text-neutral-800">Progreso</h2> 
             {showCounter && (
                 <span className="text-sm font-medium text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                     {completedSteps}/{totalSteps} ({percentage}%) 
                 </span>
             )}
        </div>
        
        <div className="relative flex-grow overflow-y-auto -mr-4 pr-4 md:-mr-6 md:pr-6">
            {steps.map((step, index) => {
                const isCurrent = index === currentStepIndex;
                const isAnswered = answeredStepIds.includes(step.id);
                const isClickable = (isCurrent || isAnswered || index < currentStepIndex) && !!onNavigateToStep;

                let dotColor, lineColor, textColor;

                if (isCurrent) {
                    dotColor = colors.current;
                    textColor = colors.textCurrent;
                    lineColor = isAnswered ? colors.lineAnswered : colors.linePending;
                } else if (isAnswered) {
                    dotColor = colors.answered;
                    textColor = colors.textAnswered;
                    lineColor = colors.lineAnswered;
                } else {
                    dotColor = colors.pending;
                    textColor = colors.textPending;
                    lineColor = colors.linePending;
                }
                
                return (
                    <div
                        key={step.id}
                        className={cn(
                            "relative flex items-start w-full text-left mb-4 pb-4 last:mb-0 last:pb-0",
                            isClickable && "cursor-pointer group",
                            !isClickable && "cursor-default"
                        )}
                        onClick={isClickable ? () => onNavigateToStep(index) : undefined}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                    >
                        {index < steps.length - 1 && (
                            <div 
                                className={cn(
                                    "absolute left-[7px] top-[22px] bottom-[-22px] w-0.5",
                                    lineColor
                                )} 
                                aria-hidden="true"
                            />
                        )}
                        <div className="flex-shrink-0 relative z-10">
                             <div 
                                className={cn(
                                    "w-4 h-4 rounded-full transition-colors duration-300", 
                                    dotColor, 
                                    isCurrent && `ring-2 ring-offset-2 ${colors.ringCurrent} ${colors.current}`,
                                    isClickable && "group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-primary-300"
                                )}
                                aria-current={isCurrent ? 'step' : undefined}
                             />
                        </div>
                        <div className="ml-3 md:ml-4">
                            <span 
                                className={cn(
                                    "text-sm font-medium transition-colors duration-300", 
                                    textColor, 
                                    isClickable && "group-hover:text-primary-600"
                                )}
                            >
                                {step.name}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    </nav>
  );
} 