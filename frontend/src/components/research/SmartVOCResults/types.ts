export interface SmartVOCResultsProps {
  className?: string;
}

export interface MetricCardProps {
  title: string;
  score: number;
  question: string;
  data: Array<{
    date: string;
    satisfied: number;
    dissatisfied: number;
  }>;
  className?: string;
}

export interface TrustFlowData {
  hour: string;
  nps: number;
  nev: number;
}

export interface CPVChartData {
  value: number;
}

export interface Distribution {
  label: string;
  percentage: number;
  color: string;
}

export interface QuestionResult {
  questionNumber: string;
  title: string;
  type: string;
  conditionality: string;
  required: boolean;
  question: string;
  responses: {
    count: number;
    timeAgo: string;
  };
  score: number;
  distribution: Distribution[];
}

export interface EmotionalState {
  name: string;
  value: number;
  isPositive: boolean;
}

export interface Cluster {
  name: string;
  value: number;
  trend: "up" | "down";
}

export interface EmotionalStatesData {
  states: EmotionalState[];
  longTermClusters: Cluster[];
  shortTermClusters: Cluster[];
}

export interface MockData {
  cpv: number;
  cpvTrend: Array<{
    date: string;
    value: number;
  }>;
  csat: {
    score: number;
    data: Array<{
      date: string;
      satisfied: number;
      dissatisfied: number;
    }>;
  };
  ces: {
    score: number;
    data: Array<{
      date: string;
      satisfied: number;
      dissatisfied: number;
    }>;
  };
  cv: {
    score: number;
    data: Array<{
      date: string;
      satisfied: number;
      dissatisfied: number;
    }>;
  };
  trustFlow: Array<{
    hour: string;
    nps: number;
    nev: number;
  }>;
  questionResults: QuestionResult[];
  emotionalStates: EmotionalStatesData;
} 