import { ProgressSidebarProps } from './types';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useParticipantStore } from '../../stores/participantStore';
import { useAnsweredStepIds } from './useAnsweredStepIds';
import { ProgressSidebarItem } from './ProgressSidebarItem';
import LoadingIndicator from '../common/LoadingIndicator';

export function ProgressSidebar({ 
  steps, 
  currentStepIndex, 
  onNavigateToStep,
}: ProgressSidebarProps) {
  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);

  const { data: moduleResponsesData, isLoading: isResponsesLoading } = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId),
  });

  const answeredStepIds = useAnsweredStepIds(steps, moduleResponsesData as unknown[]);
  const totalSteps = steps.length;
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
        {isResponsesLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <LoadingIndicator message="Revisando respuestas guardadas..." />
          </div>
        ) : (
          steps.map((step, index) => (
            <ProgressSidebarItem
              key={step.id}
              step={step}
              index={index}
              isCurrent={index === currentStepIndex}
              isAnswered={answeredStepIds.includes(step.id)}
              onNavigateToStep={onNavigateToStep}
              totalSteps={steps.length}
            />
          ))
        )}
      </div>
    </nav>
  );
} 