import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { SuccessData } from '../../../shared/interfaces/research-creation.interface';
// import { CreateSection, ErrorSection, StagesSection, SuccessSection } from '../sections';

/**
 * Componente principal del contenido de creación de investigación
 */
export const NewResearchContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const step = searchParams?.get('step') || 'create';
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  // Función para manejar creación exitosa
  const handleSuccess = useCallback((id: string, name: string) => {
    setSuccessData({ id, name });
    // La redirección será manejada por el hook useCreateResearchForm
    // Este callback es solo para casos especiales
    router.push(`/dashboard?research=${id}`);
  }, [router]);

  // Función para navegar al inicio
  const navigateToStart = useCallback(() => {
    router.push('/dashboard/research/new');
  }, [router]);

  // Función para ir al dashboard con la investigación seleccionada
  const handleClose = useCallback(() => {
    if (successData?.id) {
      router.push(`/dashboard?research=${successData.id}`);
    } else if (searchParams?.get('id')) {
      router.push(`/dashboard?research=${searchParams.get('id')}`);
    } else {
      router.push('/dashboard');
    }
  }, [router, successData, searchParams]);

  // Versión simplificada después de limpieza radical
  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Crear Nueva Investigación
        </h1>
        <p className="text-gray-600 mb-6">
          Sistema de creación de investigación simplificado. 
          Los formularios dinámicos se implementarán con JSON schema.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            🚧 En Desarrollo
          </h3>
          <p className="text-blue-700">
            Este componente será reemplazado por un sistema JSON-driven 
            que permitirá crear formularios dinámicos sin código.
          </p>
        </div>
      </div>
    </div>
  );
};
