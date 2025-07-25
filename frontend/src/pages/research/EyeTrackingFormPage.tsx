'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Comentar la importación original
// import { EyeTrackingForm } from '../../components/research/EyeTracking/EyeTrackingForm';
import { eyeTrackingService } from '../../services/eyeTrackingService';
import { 
  EyeTrackingFormData,
  DEFAULT_EYE_TRACKING_CONFIG
} from '../../types';

// Componente temporal para reemplazar EyeTrackingForm
const DisabledEyeTrackingForm = ({ researchId }: { researchId: string; onSave?: any; className?: string }) => (
  <div className={`p-6 bg-white rounded-lg border border-neutral-200`}>
    <div className="text-center py-8">
      <h3 className="text-lg font-medium text-red-600 mb-3">Componente temporalmente deshabilitado</h3>
      <p className="text-neutral-600 mb-4">
        El componente EyeTrackingForm ha sido retirado temporalmente del proceso de compilación.
      </p>
      <div className="inline-block bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-left">
        <p className="text-sm text-yellow-800">
          <strong>Nota técnica:</strong> Este componente ha sido desactivado debido a problemas con las actualizaciones de estado durante el renderizado.
        </p>
      </div>
    </div>
  </div>
);

/**
 * Página para gestionar el formulario de seguimiento ocular de una investigación
 */
const EyeTrackingFormPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('researchId') || '';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EyeTrackingFormData | null>(null);

  // Cargar la configuración de eye tracking al montar el componente
  useEffect(() => {
    const loadEyeTracking = async () => {
      if (!researchId) {
        toast.error('ID de investigación no proporcionado');
        router.push('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const data = await eyeTrackingService.getByResearchId(researchId);
        setFormData(data);
      } catch (error) {
        // console.log('No se encontró configuración existente, usando valores predeterminados');
        // Si no hay configuración existente, usar valores predeterminados
        setFormData({
          ...DEFAULT_EYE_TRACKING_CONFIG,
          researchId
        });
      } finally {
        setLoading(false);
      }
    };

    loadEyeTracking();
  }, [researchId, router]);

  /**
   * Maneja el guardado del formulario
   * @param data Datos del formulario a guardar
   */
  const handleSave = async (data: EyeTrackingFormData) => {
    if (!researchId) {return;}

    try {
      setSaving(true);
      await eyeTrackingService.updateByResearchId(researchId, {
        ...data,
        researchId
      });
      toast.success('Configuración de seguimiento ocular guardada correctamente');
      
      // Navegar a la siguiente sección o volver al panel principal
      router.push(`/dashboard?research=${researchId}`);
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!researchId || !formData) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500">Error: No se pudo cargar la configuración</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Configuración de Seguimiento Ocular</h1>
      
      <DisabledEyeTrackingForm researchId={researchId} />
    </div>
  );
};

export default EyeTrackingFormPage; 