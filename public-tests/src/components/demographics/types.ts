import { DemographicConfig, DemographicResponses, DemographicsSection } from "../../types/demographics";

export interface DemographicQuestionProps {
  config: DemographicConfig;
  value: string | number | boolean | undefined;
  onChange: (id: string, value: string | number | boolean | undefined) => void;
}

export interface DemographicsFormProps {
  config?: DemographicsSection;
  initialValues?: DemographicResponses;
  onSubmit: (responses: DemographicResponses) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  stepId?: string;
}