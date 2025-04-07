// Datos mock para la página de análisis de emociones

// Interfaces para los tipos de datos
export interface EmotionData {
  emotion: string;
  value: number;
  color: string;
}

export interface AnalysisItem {
  id: number;
  title: string;
  date: string;
  dominantEmotion: string;
  score: number;
}

export interface BulletItem {
  color: string;
  text: string;
}

// Distribución de emociones
export const emotionData: EmotionData[] = [
  { emotion: 'Joy', value: 75, color: 'bg-yellow-500' },
  { emotion: 'Trust', value: 85, color: 'bg-green-500' },
  { emotion: 'Fear', value: 45, color: 'bg-red-500' },
  { emotion: 'Surprise', value: 60, color: 'bg-purple-500' },
  { emotion: 'Sadness', value: 30, color: 'bg-blue-500' },
  { emotion: 'Disgust', value: 25, color: 'bg-emerald-500' },
  { emotion: 'Anger', value: 40, color: 'bg-orange-500' },
  { emotion: 'Anticipation', value: 70, color: 'bg-cyan-500' },
];

// Análisis recientes
export const recentAnalysis: AnalysisItem[] = [
  {
    id: 1,
    title: 'Product A Campaign',
    date: '2024-02-15',
    dominantEmotion: 'Joy',
    score: 8.5,
  },
  {
    id: 2,
    title: 'Service B Feedback',
    date: '2024-02-14',
    dominantEmotion: 'Trust',
    score: 7.8,
  },
  {
    id: 3,
    title: 'Brand Perception Study',
    date: '2024-02-13',
    dominantEmotion: 'Anticipation',
    score: 8.2,
  },
];

// Insights clave
export const keyInsights: BulletItem[] = [
  {
    color: 'bg-green-500',
    text: 'Positive emotions dominate recent studies'
  },
  {
    color: 'bg-yellow-500',
    text: 'Joy increased by 15% in the last month'
  },
  {
    color: 'bg-blue-500',
    text: 'Trust remains the strongest emotion'
  }
];

// Recomendaciones
export const recommendations: BulletItem[] = [
  {
    color: 'bg-purple-500',
    text: 'Focus on trust-building elements'
  },
  {
    color: 'bg-orange-500',
    text: 'Address negative emotions in UI/UX'
  },
  {
    color: 'bg-cyan-500',
    text: 'Enhance positive emotional triggers'
  }
];

// Próximos pasos
export const nextSteps: BulletItem[] = [
  {
    color: 'bg-emerald-500',
    text: 'Schedule detailed emotion analysis'
  },
  {
    color: 'bg-red-500',
    text: 'Review negative emotion triggers'
  },
  {
    color: 'bg-indigo-500',
    text: 'Plan follow-up research studies'
  }
]; 