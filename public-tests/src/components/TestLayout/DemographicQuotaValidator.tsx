import React, { useEffect } from 'react';
import { useDemographicQuotaValidation } from '../../hooks/useDemographicQuotaValidation';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useTestStore } from '../../stores/useTestStore';

interface DemographicQuotaValidatorProps {
  demographics: {
    age?: string;
    country?: string;
    gender?: string;
    educationLevel?: string;
    householdIncome?: string;
    employmentStatus?: string;
    dailyHoursOnline?: string;
    technicalProficiency?: string;
  };
  onValidationComplete: (isValid: boolean, reason?: string) => void;
}

/**
 * 🎯 NUEVO: Componente para validar cuotas de demográficos en tiempo real
 * Se ejecuta cuando el participante responde preguntas demográficas
 */
export const DemographicQuotaValidator: React.FC<DemographicQuotaValidatorProps> = ({
  demographics,
  onValidationComplete
}) => {
  const { researchId } = useTestStore();
  const { setQuotaResult } = useFormDataStore();

  const demographicQuotaValidation = useDemographicQuotaValidation({
    onSuccess: (result) => {
      console.log('[DemographicQuotaValidator] ✅ Validación completada:', result);

      if (!result.isValid) {
        // 🎯 GUARDAR RESULTADO DE CUOTA EN EL STORE
        setQuotaResult({
          status: 'DISQUALIFIED_OVERQUOTA',
          order: result.quotaInfo?.currentCount || 0,
          quotaLimit: result.quotaInfo?.maxQuota || 0,
          demographicType: result.quotaInfo?.demographicType,
          demographicValue: result.quotaInfo?.demographicValue,
          reason: result.reason
        });

        console.log('[DemographicQuotaValidator] 🎯 Participante descalificado por cuota:', {
          reason: result.reason,
          quotaInfo: result.quotaInfo
        });
      }

      // 🎯 NOTIFICAR AL COMPONENTE PADRE
      onValidationComplete(result.isValid, result.reason);
    },
    onError: (error) => {
      console.error('[DemographicQuotaValidator] ❌ Error en validación:', error);
      // En caso de error, permitir acceso
      onValidationComplete(true);
    }
  });

  // 🎯 EJECUTAR VALIDACIÓN CUANDO CAMBIEN LOS DEMOGRÁFICOS
  useEffect(() => {
    if (researchId && Object.keys(demographics).length > 0) {
      console.log('[DemographicQuotaValidator] 🎯 Iniciando validación de demográficos:', demographics);

      demographicQuotaValidation.mutate({
        researchId,
        demographics
      });
    }
  }, [researchId, demographics, demographicQuotaValidation]);

  // 🎯 MOSTRAR LOADING SI ESTÁ VALIDANDO
  if (demographicQuotaValidation.isPending) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Verificando cuotas...</span>
      </div>
    );
  }

  // 🎯 COMPONENTE INVISIBLE - SOLO MANEJA LA LÓGICA
  return null;
};
