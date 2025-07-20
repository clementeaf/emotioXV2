'use client';

import React from 'react';
import { CognitiveTaskHeader, NavigationTestResults, QuestionContainer } from './components';

export const CognitiveTaskResults: React.FC = () => {
  const handleFilter = () => {
    // console.log('Filtrar resultados');
  };

  const handleUpdate = () => {
    // console.log('Actualizar datos');
  };

  // Datos mockeados para demostrar todos los componentes
  const mockSentimentData = {
    id: '1',
    questionNumber: '3.1',
    questionText: '¿Qué opinas sobre la interfaz de usuario?',
    questionType: 'long_text' as const,
    required: true,
    conditionalityDisabled: false,
    sentimentResults: [
      { id: '1', text: 'La interfaz es muy intuitiva y fácil de usar', sentiment: 'positive' as const },
      { id: '2', text: 'Me gusta el diseño pero podría ser más rápido', sentiment: 'positive' as const },
      { id: '3', text: 'No encuentro lo que busco fácilmente', sentiment: 'negative' as const },
      { id: '4', text: 'Excelente experiencia de usuario', sentiment: 'positive' as const },
      { id: '5', text: 'Camera lens working memory in different scenarios', sentiment: 'positive' as const }
    ],
    themes: [
      { id: '1', name: 'Interface design', count: 342 },
      { id: '2', name: 'User experience', count: 287 },
      { id: '3', name: 'Performance', count: 264 }
    ],
    keywords: [
      { id: '1', name: 'interface', count: 213 },
      { id: '2', name: 'design', count: 187 },
      { id: '3', name: 'user', count: 145 }
    ],
    sentimentAnalysis: {
      text: 'El análisis de sentimientos muestra una tendencia positiva hacia la interfaz de usuario. Los usuarios destacan la facilidad de uso y la intuición del diseño.',
      actionables: [
        'Mantener el diseño actual que es bien recibido',
        'Optimizar el rendimiento para mejorar la experiencia',
        'Considerar feedback negativo sobre navegación'
      ]
    }
  };

  const mockChoiceData = {
    question: '¿Cuál es tu color favorito?',
    description: 'Selecciona tu color preferido de la lista',
    totalResponses: 1250,
    responseDuration: '2.5 min promedio',
    options: [
      { id: '1', text: 'Azul', percentage: 35, color: '#3B82F6' },
      { id: '2', text: 'Verde', percentage: 25, color: '#10B981' },
      { id: '3', text: 'Rojo', percentage: 20, color: '#EF4444' },
      { id: '4', text: 'Amarillo', percentage: 15, color: '#F59E0B' },
      { id: '5', text: 'Púrpura', percentage: 5, color: '#8B5CF6' }
    ]
  };

  const mockRankingData = {
    options: [
      {
        id: '1',
        text: 'Velocidad',
        mean: 4.2,
        responseTime: '45s',
        distribution: { 1: 5, 2: 10, 3: 15, 4: 25, 5: 30, 6: 15 }
      },
      {
        id: '2',
        text: 'Diseño',
        mean: 3.8,
        responseTime: '52s',
        distribution: { 1: 8, 2: 12, 3: 20, 4: 30, 5: 20, 6: 10 }
      },
      {
        id: '3',
        text: 'Funcionalidad',
        mean: 4.5,
        responseTime: '38s',
        distribution: { 1: 3, 2: 8, 3: 12, 4: 20, 5: 35, 6: 22 }
      },
      {
        id: '4',
        text: 'Precio',
        mean: 3.2,
        responseTime: '61s',
        distribution: { 1: 15, 2: 20, 3: 25, 4: 20, 5: 15, 6: 5 }
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Título común para todas las preguntas */}
      <CognitiveTaskHeader title="2.0.- Cognitive task" />

      {/* Pregunta de análisis de sentimientos */}
      <QuestionContainer
        questionId="3.1.- Sentiment Analysis"
        questionType="Sentiment Analysis"
        conditionalityDisabled={false}
        required={true}
        hasNewData={true}
        viewType="sentiment"
        sentimentData={mockSentimentData}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Pregunta de opciones múltiples */}
      <QuestionContainer
        questionId="3.2.- Multiple Choice"
        questionType="Multiple Choice"
        conditionalityDisabled={false}
        required={true}
        hasNewData={false}
        viewType="choice"
        choiceData={mockChoiceData}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Pregunta de ranking */}
      <QuestionContainer
        questionId="3.3.- Ranking Question"
        questionType="Ranking"
        conditionalityDisabled={false}
        required={true}
        hasNewData={true}
        viewType="ranking"
        rankingData={mockRankingData}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Navigation Test - 3.7 */}
      <NavigationTestResults
        questionId="3.7.-Navigation Test"
        questionType="Navigation Test"
        conditionalityDisabled={true}
        required={true}
      />
    </div>
  );
};
