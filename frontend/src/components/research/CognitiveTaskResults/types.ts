// Definiciones de tipos para el módulo de resultados de tareas cognitivas

// Tipos para análisis de sentimientos
export interface SentimentResult {
  id: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'green';
  selected?: boolean;
  type?: 'comment' | 'object' | 'theme' | 'keyword';
}

export interface ThemeResult {
  id: string;
  name: string;
  count: number;
}

export interface KeywordResult {
  id: string;
  name: string;
  count: number;
}

export interface SentimentAnalysis {
  text: string;
  actionables?: string[];
}

export interface CognitiveTaskQuestion {
  id: string;
  questionNumber: string;
  questionText: string;
  questionType: 'short_text' | 'multiple_choice' | 'rating' | 'long_text';
  required: boolean;
  conditionalityDisabled?: boolean;
  sentimentResults?: SentimentResult[];
  themes?: ThemeResult[];
  keywords?: KeywordResult[];
  sentimentAnalysis?: SentimentAnalysis;
  newData?: boolean;
}

// Interfaces para las métricas de resumen
export interface SummaryMetric {
  value: number | string;
  trend: number;
  trendDirection: 'up' | 'down';
  comparisonText: string;
}

export interface CognitiveSummary {
  averagePerformance: SummaryMetric;
  completionRate: SummaryMetric;
  averageTime: SummaryMetric;
  errorRate: SummaryMetric;
}

// Interfaces para tareas cognitivas
export interface CognitiveSubtask {
  name: string;
  score: number;
  percentage: number;
}

export interface CognitiveTaskResult {
  id: string;
  taskName: string;
  taskDescription: string;
  completed: number;
  totalParticipants: number;
  score: number;
  maxScore: number;
  averageTime: string;
  status: 'completed' | 'in-progress' | 'pending';
  subtasks?: CognitiveSubtask[];
  heatmapUrl?: string;
  trendVsControl?: number;
}

// Interfaces para visualizaciones
export interface ScatterDataPoint {
  x: number;
  y: number;
  cluster: number;
}

export interface ClusterGroup {
  id: number;
  name: string;
  color: string;
}

export interface VisualizationData {
  type: 'scatter' | 'heatmap' | 'line' | 'bar';
  title: string;
  description?: string;
  data: ScatterDataPoint[] | any[];
  clusters?: ClusterGroup[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// Interfaces para filtros
export interface FilterOption {
  id: string;
  name: string;
  value: string;
  count?: number;
}

export interface FilterSection {
  id: string;
  title: string;
  options: FilterOption[];
  type: 'checkbox' | 'radio' | 'range';
  initialVisibleItems?: number;
}

export interface CognitiveTaskResultsFilters {
  sections: FilterSection[];
  activeFilters: Record<string, string[]>;
}

// Interfaz para la configuración del componente de resultados
export interface CognitiveTaskResultsConfig {
  title: string;
  description: string;
  showFilters: boolean;
  showExport: boolean;
  showVisualization: boolean;
  showEyeTracking: boolean;
}

// Interfaz para análisis de datos de eye tracking
export interface EyeTrackingData {
  fixationPoints: {
    x: number;
    y: number;
    duration: number;
    intensity: number;
  }[];
  areaOfInterest: {
    id: string;
    name: string;
    fixationPercentage: number;
  }[];
}

export interface CognitiveTaskResultsProps {
  className?: string;
  questionId?: string;
}

export interface SummaryMetrics {
  averageScore: number;
  completionRate: number;
  averageTime: string;
  errorRate: number;
  trendVsGroup: number;
  trendVsHistory: number;
  trendVsLastEvaluation: string;
  trendVsAverage: number;
} 