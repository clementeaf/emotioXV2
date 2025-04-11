import { QuestionResults } from "./QuestionResults";
import { NPSQuestion } from "./NPSQuestion";

interface SmartVOCResultsProps {
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
  distribution: Array<{
    label: string;
    percentage: number;
    color: string;
  }>;
  npsData: {
    monthlyData: Array<{
      month: string;
      promoters: number;
      neutrals: number;
      detractors: number;
      npsRatio: number;
    }>;
    loyaltyEvolution: {
      promoters: number;
      promotersTrend: "up" | "down";
      detractors: number;
      detractorsTrend: "up" | "down";
      neutrals: number;
      neutralsTrend: "up" | "down";
      changePercentage: number;
    };
  };
}

export function SmartVOCResults({ npsData, ...props }: SmartVOCResultsProps) {
  return (
    <div className="space-y-6">
      <QuestionResults {...props} />
      <NPSQuestion 
        monthlyData={npsData.monthlyData}
        loyaltyEvolution={npsData.loyaltyEvolution}
      />
    </div>
  );
} 