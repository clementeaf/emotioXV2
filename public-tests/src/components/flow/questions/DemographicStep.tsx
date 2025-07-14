import { useState } from "react";
import { DemographicResponses, DemographicsSection } from "../../../types/demographics";
import { DemographicsForm } from "../../demographics/DemographicsForm";
import { DemographicStepProps } from "./types";

export const DemographicStep: React.FC<DemographicStepProps & { savedResponse?: any, responsesData?: any[] }> = ({
    stepConfig,
    stepId,
    onStepComplete,
    onError,
    savedResponse,
    responsesData = []
}) => {
    const [loading, setLoading] = useState(false);
    const formConfig = (stepConfig as { demographicsConfig?: DemographicsSection })?.demographicsConfig as DemographicsSection | undefined;

    // LOGS DE DEPURACIÓN
    console.log('DemographicStep - responsesData:', responsesData);
    console.log('DemographicStep - stepId:', stepId);

    // Buscar la respuesta demográfica de manera más flexible
    const demographicObj = Array.isArray(responsesData)
      ? responsesData.find((r) => {
          console.log('DemographicStep - checking response:', r);
          // Buscar por stepType que sea 'demographic' (como se guarda en el backend)
          const stepTypeMatch = r.stepType === 'demographic';
          // O buscar por questionKey que contenga 'demographics' o 'demographic'
          const questionKeyMatch = r.questionKey && (
            r.questionKey === 'demographics-form' ||
            r.questionKey.includes('demographics') ||
            r.questionKey.includes('demographic')
          );

          const hasResponse = r.response;
          const result = (stepTypeMatch || questionKeyMatch) && hasResponse;
          console.log('DemographicStep - match result:', result, 'for response:', r);
          return result;
        })
      : undefined;
    const initialFormValues = demographicObj ? demographicObj.response : {};

    // LOGS DE DEPURACIÓN
    console.log('DemographicStep - demographicObj:', demographicObj);
    console.log('DemographicStep - initialFormValues:', initialFormValues);

    // Usar id de la respuesta guardada si existe, si no, stepId o 'demographic'
    const demographicResponseId = (demographicObj && demographicObj.id)
      ? demographicObj.id
      : stepId || 'demographic';

    const handleDemographicSubmit = async (responses: DemographicResponses) => {
        setLoading(true);
        try {
            if (onStepComplete) {
                onStepComplete(responses);
            }
        } catch (error) {
            if (onError) {
                onError(error instanceof Error ? error.message : 'Error procesando el paso demográfico.', 'demographic');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <DemographicsForm
            key={demographicResponseId}
            config={formConfig}
            initialValues={initialFormValues}
            onSubmit={handleDemographicSubmit}
            isLoading={loading}
            stepId={stepId || 'demographic'}
        />
    );
};
