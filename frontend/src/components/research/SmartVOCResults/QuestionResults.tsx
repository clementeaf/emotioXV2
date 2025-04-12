import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Progress from "./ui/Progress";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

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
  monthlyData?: Array<{
    month: string;
    promoters: number;
    neutrals: number;
    detractors: number;
    npsRatio: number;
  }>;
  loyaltyEvolution?: {
    promoters: number;
    promotersTrend: "up" | "down";
    detractors: number;
    detractorsTrend: "up" | "down";
    neutrals: number;
    neutralsTrend: "up" | "down";
    changePercentage: number;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm text-gray-600 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium">
              {entry.name}: {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function QuestionResults({ 
  questionNumber,
  title,
  type,
  conditionality,
  required,
  question,
  responses,
  score,
  distribution,
  monthlyData,
  loyaltyEvolution
}: QuestionResultProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">{questionNumber}- Question: {title}</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-700">{type}</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">{conditionality}</Badge>
            {required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
          </div>

          <div className="flex items-start gap-8">
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
        </div>
      </Card>

      {monthlyData && (
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">2.5.- Question: Net Promoter Score (NPS)</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Linear Scale question</Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Promoters</span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <Progress 
                  value={78} 
                  className="h-2" 
                  indicatorClassName="bg-green-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Detractors</span>
                  <span className="text-sm font-medium">22%</span>
                </div>
                <Progress 
                  value={22} 
                  className="h-2" 
                  indicatorClassName="bg-red-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm">NPS' question</span>
              </div>
              <p className="text-sm text-gray-500">On a scale from 0-10, how likely are you to recommend [company] to a friend or colleague?</p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Responses</span>
                <span className="text-2xl font-semibold">28,635</span>
                <span className="text-sm text-gray-500">26s</span>
              </div>
              <div className="w-24 h-24">
                <CircularProgress value={63} size={96} strokeWidth={8} />
              </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    stroke="#9CA3AF"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="promoters" 
                    stackId="a" 
                    fill="#4ADE80"
                    radius={[4, 4, 0, 0]}
                    name="Promoters"
                  />
                  <Bar 
                    dataKey="neutrals" 
                    stackId="a" 
                    fill="#E5E7EB"
                    name="Neutrals"
                  />
                  <Bar 
                    dataKey="detractors" 
                    stackId="a" 
                    fill="#F87171"
                    name="Detractors"
                  />
                  <Line
                    type="monotone"
                    dataKey="npsRatio"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#4F46E5" }}
                    activeDot={{ r: 6 }}
                    name="NPS Ratio"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {loyaltyEvolution && (
              <div className="flex justify-between items-start mt-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Loyalty's Evolution</h3>
                  {loyaltyEvolution.changePercentage && (
                    <div className="text-green-600 font-medium">
                      +{loyaltyEvolution.changePercentage}% Since last month
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-semibold">{loyaltyEvolution.promoters ?? 0}%</span>
                      {loyaltyEvolution.promotersTrend && (
                        loyaltyEvolution.promotersTrend === "up" ? (
                          <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                          </svg>
                        )
                      )}
                    </div>
                    <span className="text-sm text-gray-600">Promoters</span>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-semibold">{loyaltyEvolution.detractors ?? 0}%</span>
                      {loyaltyEvolution.detractorsTrend && (
                        loyaltyEvolution.detractorsTrend === "up" ? (
                          <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                          </svg>
                        )
                      )}
                    </div>
                    <span className="text-sm text-gray-600">Detractors</span>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-semibold">{loyaltyEvolution.neutrals ?? 0}%</span>
                      {loyaltyEvolution.neutralsTrend && (
                        loyaltyEvolution.neutralsTrend === "up" ? (
                          <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                          </svg>
                        )
                      )}
                    </div>
                    <span className="text-sm text-gray-600">Neutrals</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 