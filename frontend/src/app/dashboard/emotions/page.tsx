'use client';

import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Sidebar } from '@/components/layout/Sidebar';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Suspense, memo } from 'react';

// Extraer datos mock a un archivo separado
import {
    emotionData,
    keyInsights,
    nextSteps,
    recentAnalysis,
    recommendations
} from '@/data/emotionsMockData';

// Interfaces para los tipos de datos
interface EmotionData {
  emotion: string;
  value: number;
  color: string;
}

interface AnalysisItem {
  id: number;
  title: string;
  date: string;
  dominantEmotion: string;
  score: number;
}

interface BulletItem {
  color: string;
  text: string;
}

// Utilidad para formatear fechas
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

// Componente para la barra de progreso de emociones
const EmotionBar = memo(({ emotion, value, color }: EmotionData) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-neutral-600 w-24">{emotion}</span>
    <div className="flex-1 mx-4">
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
    <span className="text-sm text-neutral-600 w-12 text-right">{value}%</span>
  </div>
));

EmotionBar.displayName = 'EmotionBar';

// Componente para el elemento de análisis reciente
const AnalysisItem = memo(({ item }: { item: AnalysisItem }) => (
  <div className="flex items-start justify-between">
    <div>
      <h4 className="text-sm font-medium text-neutral-900">{item.title}</h4>
      <p className="text-xs text-neutral-500 mt-1">
        {formatDate(item.date)}
      </p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-neutral-900">{item.dominantEmotion}</p>
      <p className="text-xs text-neutral-500 mt-1">Score: {item.score}</p>
    </div>
  </div>
));

AnalysisItem.displayName = 'AnalysisItem';

// Componente para los elementos de lista con punto de color
const BulletPoint = memo(({ color, text }: BulletItem) => (
  <li className="flex items-start">
    <span className={`inline-block w-2 h-2 rounded-full ${color} mt-1.5 mr-2`}></span>
    <p className="text-sm text-neutral-600">{text}</p>
  </li>
));

BulletPoint.displayName = 'BulletPoint';

// Componente para la sección de distribución de emociones
const EmotionDistribution = memo(() => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Emotion Distribution</h3>
    <div className="space-y-4">
      {emotionData.map((item: EmotionData) => (
        <EmotionBar
          key={item.emotion}
          emotion={item.emotion}
          value={item.value}
          color={item.color}
        />
      ))}
    </div>
  </div>
));

EmotionDistribution.displayName = 'EmotionDistribution';

// Componente para la sección de análisis recientes
const RecentAnalysis = memo(() => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Recent Analysis</h3>
    <div className="space-y-6">
      {recentAnalysis.map((analysis: AnalysisItem) => (
        <AnalysisItem key={analysis.id} item={analysis} />
      ))}
    </div>
  </div>
));

RecentAnalysis.displayName = 'RecentAnalysis';

// Componente para la sección de insights
const InsightsSection = memo(() => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Key Insights</h3>
    <ul className="space-y-3">
      {keyInsights.map((insight: BulletItem, index: number) => (
        <BulletPoint
          key={index}
          color={insight.color}
          text={insight.text}
        />
      ))}
    </ul>
  </div>
));

InsightsSection.displayName = 'InsightsSection';

// Componente para la sección de recomendaciones
const RecommendationsSection = memo(() => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Recommendations</h3>
    <ul className="space-y-3">
      {recommendations.map((rec: BulletItem, index: number) => (
        <BulletPoint
          key={index}
          color={rec.color}
          text={rec.text}
        />
      ))}
    </ul>
  </div>
));

RecommendationsSection.displayName = 'RecommendationsSection';

// Componente para la sección de próximos pasos
const NextStepsSection = memo(() => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Next Steps</h3>
    <ul className="space-y-3">
      {nextSteps.map((step: BulletItem, index: number) => (
        <BulletPoint
          key={index}
          color={step.color}
          text={step.text}
        />
      ))}
    </ul>
  </div>
));

NextStepsSection.displayName = 'NextStepsSection';

// Componente contenido principal
const EmotionsContent = () => {
  return (
    <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
      <div className="mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Emotion Analysis</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Track and analyze emotional responses across your research projects
          </p>
        </div>

        {/* Emotion Distribution y Recent Analysis */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <EmotionDistribution />
          <RecentAnalysis />
        </div>

        {/* Emotion Insights, Recommendations, Next Steps */}
        <div className="grid grid-cols-3 gap-6">
          <InsightsSection />
          <RecommendationsSection />
          <NextStepsSection />
        </div>
      </div>
    </div>
  );
};

// Usar el HOC para envolver el componente
const EmotionsContentWithSuspense = withSearchParams(EmotionsContent);

export default function EmotionsPage() {
  const { token } = useProtectedRoute();

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8">
        <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
          <EmotionsContentWithSuspense />
        </Suspense>
      </div>
    </div>
  );
}
