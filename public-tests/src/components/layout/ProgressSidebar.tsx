import { ProgressSidebarProps } from './types';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useParticipantStore } from '../../stores/participantStore';
import { useAnsweredStepIds } from './useAnsweredStepIds';
import { ProgressSidebarItem } from './ProgressSidebarItem';
import LoadingIndicator from '../common/LoadingIndicator';
import { useMemo, useState, useEffect } from 'react';

export function ProgressSidebar({ 
  steps, 
  currentStepIndex, 
  onNavigateToStep,
}: ProgressSidebarProps) {
  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);
  const responsesData = useParticipantStore(state => state.responsesData);
  const maxVisitedIndex = useParticipantStore(state => state.maxVisitedIndex);
  
  // Estado para mostrar/ocultar debug info
  const [showDebug, setShowDebug] = useState(false);

  const { data: moduleResponsesData, isLoading: isResponsesLoading, error: moduleResponsesError } = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId),
  });

  // Logs detallados de useModuleResponses
  useEffect(() => {
    console.group('🔍 [ProgressSidebar] useModuleResponses Debug');
    console.log('📋 Parámetros de entrada:', {
      researchId,
      participantId,
      autoFetch: !!(researchId && participantId),
    });
    console.log('⏳ Estado de carga:', {
      isResponsesLoading,
      moduleResponsesError: moduleResponsesError || 'Sin errores',
    });
    console.log('📊 Datos recibidos:', {
      moduleResponsesData,
      tipoDeRespuesta: typeof moduleResponsesData,
      esArray: Array.isArray(moduleResponsesData),
      cantidad: Array.isArray(moduleResponsesData) ? moduleResponsesData.length : 'No es array',
    });
    
    if (Array.isArray(moduleResponsesData) && moduleResponsesData.length > 0) {
      console.log('📝 Primeras 3 respuestas:', moduleResponsesData.slice(0, 3));
      console.log('🏷️ Tipos de step encontrados:', 
        [...new Set(moduleResponsesData.map((resp: unknown) => {
          if (typeof resp === 'object' && resp !== null && 'stepType' in resp) {
            return (resp as { stepType?: string }).stepType;
          }
          return 'tipo-desconocido';
        }))]
      );
      console.log('🆔 IDs de step encontrados:', 
        moduleResponsesData.map((resp: unknown) => {
          if (typeof resp === 'object' && resp !== null) {
            const r = resp as { id?: string; stepId?: string };
            return r.id || r.stepId || 'sin-id';
          }
          return 'objeto-inválido';
        }).slice(0, 10) // Solo los primeros 10
      );
    }
    
    console.log('🏪 Store local responsesData:', {
      responsesData,
      allSteps: responsesData?.modules?.all_steps?.length || 0,
      cognitive: responsesData?.modules?.cognitive_task?.length || 0,
      smartvoc: responsesData?.modules?.smartvoc?.length || 0,
    });
    
    console.groupEnd();
  }, [moduleResponsesData, isResponsesLoading, moduleResponsesError, researchId, participantId, responsesData]);

  // Combinar datos del store local y de la API para obtener una vista completa de los pasos respondidos
  const combinedResponsesData = useMemo(() => {
    console.group('🔄 [ProgressSidebar] Combinando respuestas');
    
    const localResponses = responsesData?.modules?.all_steps || [];
    const apiResponses = (moduleResponsesData as unknown[]) || [];
    
    console.log('📂 Respuestas locales:', {
      cantidad: localResponses.length,
      respuestas: localResponses.map(r => ({ id: r.id, stepType: r.stepType, stepTitle: r.stepTitle }))
    });
    
    console.log('🌐 Respuestas de API:', {
      cantidad: apiResponses.length,
      respuestas: apiResponses.map((r: unknown) => {
        if (typeof r === 'object' && r !== null) {
          const resp = r as { id?: string; stepType?: string; stepTitle?: string };
          return { id: resp.id, stepType: resp.stepType, stepTitle: resp.stepTitle };
        }
        return { error: 'objeto-inválido' };
      })
    });
    
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
    
    console.log('🎯 Resultado combinado:', {
      totalCombinadas: combined.length,
      totalUnicas: unique.length,
      respuestasFinales: unique.map(r => {
        const resp = r as { id?: string; stepType?: string; stepTitle?: string };
        return { id: resp.id, stepType: resp.stepType, stepTitle: resp.stepTitle };
      })
    });
    
    console.groupEnd();
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
    
    console.log('📊 [ProgressSidebar] Cálculo de progreso:', {
      totalSteps: steps.length,
      relevantSteps: totalRelevant,
      answeredStepIds: answeredStepIds.length,
      relevantAnswered: completedRelevant,
      percentage
    });
    
    return {
      completedSteps: completedRelevant,
      totalSteps: totalRelevant,
      percentage
    };
  }, [steps, answeredStepIds]);

  const showCounter = progressInfo.totalSteps > 0;

  // Mejorar el handler de navegación con logging
  const handleNavigateToStep = (targetIndex: number) => {
    console.log(`[ProgressSidebar] Solicitando navegación al índice: ${targetIndex}`);
    console.log(`[ProgressSidebar] Paso objetivo:`, steps[targetIndex]);
    
    if (onNavigateToStep) {
      onNavigateToStep(targetIndex);
    } else {
      console.warn('[ProgressSidebar] onNavigateToStep no está disponible');
    }
  };

  return (
    <nav 
      aria-label="Progreso del estudio"
      className="w-56 md:w-64 h-screen bg-white border-r border-neutral-200 flex flex-col sticky top-0 shrink-0 shadow-sm"
    >
      {/* Header con mejor diseño */}
      <div className="px-4 md:px-6 py-4 md:py-6 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-neutral-800">Progreso</h2> 
          {showCounter && (
            <span className="text-xs font-medium text-primary-700 bg-primary-100 px-2 py-1 rounded-full whitespace-nowrap">
              {progressInfo.completedSteps}/{progressInfo.totalSteps}
            </span>
          )}
        </div>
        
        {/* Barra de progreso visual */}
        {showCounter && (
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressInfo.percentage}%` }}
            />
          </div>
        )}
        
        {showCounter && (
          <p className="text-xs text-neutral-600 mt-2">
            {progressInfo.percentage}% completado
          </p>
        )}
      </div>
      
      {/* Debug toggle button - solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-4 py-2 border-b border-neutral-100">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-neutral-500 hover:text-neutral-700 underline"
          >
            {showDebug ? 'Ocultar' : 'Mostrar'} debug info
          </button>
        </div>
      )}
      
      {/* Debug info mejorado - solo visible cuando se activa */}
      {process.env.NODE_ENV === 'development' && showDebug && (
        <div className="mx-4 my-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-800 space-y-1">
            <div className="font-medium mb-2">Estado Debug:</div>
            <div>Paso actual: {currentStepIndex}</div>
            <div>Máximo visitado: {maxVisitedIndex}</div>
            <div>Pasos respondidos: {answeredStepIds.length}</div>
            <div>Respuestas cargadas: {combinedResponsesData.length}</div>
            <div>Total pasos: {steps.length}</div>
            <div className="font-medium mt-2">useModuleResponses:</div>
            <div>Loading: {isResponsesLoading ? 'Sí' : 'No'}</div>
            <div>Error: {moduleResponsesError || 'Ninguno'}</div>
            <div>Datos: {Array.isArray(moduleResponsesData) ? `${moduleResponsesData.length} items` : typeof moduleResponsesData}</div>
          </div>
        </div>
      )}
      
      {/* Lista de pasos con mejor organización */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {isResponsesLoading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <LoadingIndicator message="Cargando progreso..." />
          </div>
        ) : (
          <div className="space-y-1">
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
      
      {/* Footer con información adicional */}
      <div className="px-4 md:px-6 py-3 border-t border-neutral-100 bg-neutral-50">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>Estudio: {researchId?.slice(-8) || 'N/A'}</span>
          {participantId && (
            <span>ID: {participantId.slice(-6)}</span>
          )}
        </div>
      </div>
    </nav>
  );
} 