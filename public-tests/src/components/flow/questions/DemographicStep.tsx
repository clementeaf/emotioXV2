import { useState } from "react";
import { DemographicResponses, DemographicsSection } from "../../../types/demographics";
import { DemographicsForm } from "../../demographics/DemographicsForm";
import { DemographicStepProps } from "./types";

function extractDemographicInitialValues(initialValues: any): DemographicResponses {
    // Si es un array, buscar el primer objeto con campo 'response'
    if (Array.isArray(initialValues) && initialValues.length > 0) {
        const found = initialValues.find((r) => r && typeof r === 'object' && 'response' in r);
        if (found && typeof found.response === 'object') {
            return found.response;
        }
    }
    // Si es un objeto con campo 'response', usar ese campo
    if (initialValues && typeof initialValues === 'object' && 'response' in initialValues) {
        return initialValues.response;
    }
    // Si es un objeto plano (ej: {age: 30}), usarlo directamente
    if (initialValues && typeof initialValues === 'object') {
        return initialValues;
    }
    // Si no hay nada, devolver objeto vacío
    return {};
}

export const DemographicStep: React.FC<DemographicStepProps & { savedResponse?: any }> = ({
    stepConfig,
    stepId,
    onStepComplete,
    onError,
    savedResponse
}) => {
    const [loading, setLoading] = useState(false);
    const initialFormValues = extractDemographicInitialValues(savedResponse);
    const formConfig = (stepConfig as { demographicsConfig?: DemographicsSection })?.demographicsConfig as DemographicsSection | undefined;

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
            config={formConfig}
            initialValues={initialFormValues}
            onSubmit={handleDemographicSubmit}
            isLoading={loading}
            stepId={stepId || 'demographic'}
        />
    );
};
