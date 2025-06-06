import { useState } from "react";
import { DemographicResponses, DemographicsSection } from "../../../types/demographics";
import { DemographicsForm } from "../../demographics/DemographicsForm";
import { DemographicStepProps } from "./types";

export const DemographicStep: React.FC<DemographicStepProps> = ({
    stepConfig,
    stepId,
    onStepComplete,
    onError
}) => {
    const [loading, setLoading] = useState(false);
    const initialFormValues = (stepConfig as { savedResponses?: Record<string, unknown> })?.savedResponses || {};
    const formConfig = (stepConfig as { demographicsConfig?: DemographicsSection })?.demographicsConfig as DemographicsSection | undefined;

    const handleDemographicSubmit = async (responses: DemographicResponses) => {
        setLoading(true);
        try {
            if (onStepComplete) {
                onStepComplete(responses);
            }
        } catch (error) {
            console.error('[DemographicStep] Error inesperado en handleDemographicSubmit:', error);
            if (onError) {
                onError(error instanceof Error ? error.message : 'Error procesando el paso demográfico.', 'demographic');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <DemographicsForm
            config={formConfig}
            initialValues={initialFormValues}
            onSubmit={handleDemographicSubmit}
            isLoading={loading}
            stepId={stepId || 'demographic'}
        />
    );
};