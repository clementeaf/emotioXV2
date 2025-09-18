import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

/**
 * Componente de loading específico para el ResearchStageManager
 * Simula la estructura completa del layout con sidebar y contenido principal
 */
export function StageLoadingState() {
  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Barra lateral simulada */}
      <div className="w-60">
        <div className="bg-white rounded-lg shadow-sm mx-4 mt-4 p-6">
          <div className="h-8 bg-neutral-200 rounded w-3/4 mb-8"></div>

          <div className="space-y-6">
            <div>
              <div className="h-4 bg-neutral-200 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="h-8 bg-neutral-200 rounded-md"></div>
                <div className="h-8 bg-neutral-200 rounded-md"></div>
                <div className="h-8 bg-neutral-200 rounded-md"></div>
              </div>
            </div>

            <div>
              <div className="h-4 bg-neutral-200 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="h-8 bg-neutral-200 rounded-md"></div>
                <div className="h-8 bg-neutral-200 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col mt-12 pr-7 pb-4">
        <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
          <div className="mx-auto px-6 py-8">
            <LoadingSkeleton variant="full" />
          </div>
        </div>
      </div>
    </div>
  );
}