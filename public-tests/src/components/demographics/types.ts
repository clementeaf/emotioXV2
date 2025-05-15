import { DemographicConfig, DemographicResponses, DemographicsSection } from "../../types/demographics";

export interface DemographicQuestionProps {
  config: DemographicConfig;
  value: any;
  onChange: (id: string, value: any) => void;
}

export interface DemographicsFormProps {
  config?: DemographicsSection;
  initialValues?: DemographicResponses;
  onSubmit: (responses: DemographicResponses) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  stepId?: string;
}