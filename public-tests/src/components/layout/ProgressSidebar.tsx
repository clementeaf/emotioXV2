import { ProgressSidebarProps } from './types';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useParticipantStore } from '../../stores/participantStore';
import { useAnsweredStepIds } from './useAnsweredStepIds';
import { ProgressSidebarItem } from './ProgressSidebarItem';
import LoadingIndicator from '../common/LoadingIndicator';
import { useMemo } from 'react';

export function ProgressSidebar({ 
  steps, 
  currentStepIndex, 
  onNavigateToStep,
}: ProgressSidebarProps) {
  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);
  const responsesData = useParticipantStore(state => state.responsesData);

  const { data: moduleResponsesData, isLoading: isResponsesLoading } = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId),
  });

  // Combinar datos del store local y de la API para obtener una vista completa de los pasos respondidos
  const combinedResponsesData = useMemo(() => {
    const localResponses = responsesData?.modules?.all_steps || [];
    const apiResponses = (moduleResponsesData as unknown[]) || [];
    
    // Combinar y deduplicar respuestas
    const combined = [...localResponses, ...apiResponses];
    const unique = combined.filter((response, index, self) => {
      if (!response || typeof response !== 'object') return false;
      const resp = response as { id?: string };
      return resp.id && index === self.findIndex((r) => {
        const rObj = r as { id?: string };
        return rObj.id === resp.id;
      });
    });
    
    return unique;
  }, [responsesData?.modules?.all_steps, moduleResponsesData]);

  const answeredStepIds = useAnsweredStepIds(steps, combinedResponsesData);

  // Calcular progreso más preciso
  const progressInfo = useMemo(() => {
    if (!steps.length) return { completedSteps: 0, totalSteps: 0, percentage: 0 };
    
    // Excluir welcome y thankyou del conteo si existen
    const relevantSteps = steps.filter(step => 
      step.type !== 'welcome' && step.type !== 'thankyou'
    );
    
    const relevantAnswered = answeredStepIds.filter(id => {
      const step = steps.find(s => s.id === id);
      return step && step.type !== 'welcome' && step.type !== 'thankyou';
    });
    
    const completedRelevant = relevantAnswered.length;
    const totalRelevant = relevantSteps.length;
    const percentage = totalRelevant > 0 ? Math.round((completedRelevant / totalRelevant) * 100) : 0;
    
    return {
      completedSteps: completedRelevant,
      totalSteps: totalRelevant,
      percentage
    };
  }, [steps, answeredStepIds]);

  const showCounter = progressInfo.totalSteps > 0;

  // Handler de navegación
  const handleNavigateToStep = (targetIndex: number) => {
    if (onNavigateToStep) {
      onNavigateToStep(targetIndex);
    }
  };

  return (
    <nav 
      aria-label="Progreso del estudio"
      className="w-64 h-full flex flex-col shrink-0"
    >
      {/* Header minimalista */}
      <div className="px-6 py-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Progreso</h2> 
            {showCounter && (
              <span className="text-xs font-mono text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">
                {progressInfo.completedSteps}/{progressInfo.totalSteps}
              </span>
            )}
          </div>
          
          {showCounter && (
            <div className="text-xs text-neutral-500 font-mono">
              {progressInfo.percentage}% completado
            </div>
          )}
        </div>
      </div>
      
      {/* Lista de pasos con diseño minimalista */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        {isResponsesLoading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <LoadingIndicator message="Cargando..." />
          </div>
        ) : (
          <div className="space-y-0.5">
            {steps.map((step, index) => (
              <ProgressSidebarItem
                key={`${step.id}-${index}`}
                step={step}
                index={index}
                isCurrent={index === currentStepIndex}
                isAnswered={answeredStepIds.includes(step.id)}
                onNavigateToStep={handleNavigateToStep}
                totalSteps={steps.length}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer minimalista */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
          <span>ID: {researchId?.slice(-6) || 'N/A'}</span>
        </div>
      </div>
    </nav>
  );
} 