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

    const demographicObj = Array.isArray(responsesData)
      ? responsesData.find((r) => {
          const stepTypeMatch = r.stepType === 'demographic';
          const questionKeyMatch = r.questionKey && (
            r.questionKey === 'demographics-form' ||
            r.questionKey.includes('demographics') ||
            r.questionKey.includes('demographic')
          );

          const hasResponse = r.response;
          const result = (stepTypeMatch || questionKeyMatch) && hasResponse;
          return result;
        })
      : undefined;
    const initialFormValues = demographicObj ? demographicObj.response : {};

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
