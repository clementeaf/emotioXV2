import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Progress from "@/components/ui/Progress";
import { CircularProgress } from "@/components/ui/CircularProgress";

interface QuestionResultProps {
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
}

export function QuestionResults({ 
  questionNumber,
  title,
  type,
  conditionality,
  required,
  question,
  responses,
  score,
  distribution
}: QuestionResultProps) {
  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">{questionNumber}- Question: {title}</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-700">{type}</Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">{conditionality}</Badge>
          {required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
        </div>

        <div className="space-y-6">
          {distribution.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-medium">{item.percentage}%</span>
              </div>
              <Progress 
                value={item.percentage} 
                className="h-2" 
                indicatorClassName={
                  item.color === "green" ? "bg-green-500" :
                  item.color === "gray" ? "bg-gray-400" :
                  "bg-red-500"
                }
              />
            </div>
          ))}
        </div>

        <div className="flex items-start gap-8 mt-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Question</span>
            </div>
            <p className="text-sm text-gray-800">{question}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Responses</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{responses.count}</span>
                <span className="text-sm text-gray-500">{responses.timeAgo}</span>
              </div>
            </div>

            <div className="w-24 h-24">
              <CircularProgress value={score} size={96} strokeWidth={8} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 