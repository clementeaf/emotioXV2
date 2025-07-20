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

  // Datos mock para Linear Scale (3.4)
  const mockLinearScaleData = {
    question: '¿Qué tan satisfecho estás con el servicio al cliente?',
    description: 'Evalúa tu satisfacción en una escala del 1 al 10',
    scaleRange: { start: 1, end: 10 },
    responses: [
      { value: 1, count: 15 },
      { value: 2, count: 25 },
      { value: 3, count: 45 },
      { value: 4, count: 60 },
      { value: 5, count: 85 },
      { value: 6, count: 120 },
      { value: 7, count: 180 },
      { value: 8, count: 220 },
      { value: 9, count: 150 },
      { value: 10, count: 100 }
    ],
    average: 7.2,
    totalResponses: 1000,
    distribution: {
      1: 15, 2: 25, 3: 45, 4: 60, 5: 85,
      6: 120, 7: 180, 8: 220, 9: 150, 10: 100
    },
    responseTime: '1.8 min promedio'
  };

  // Datos mock para Rating (3.5)
  const mockRatingData = {
    question: '¿Cómo calificarías la experiencia de usuario?',
    description: 'Califica usando estrellas del 1 al 5',
    ratingType: 'stars' as const,
    responses: [
      { rating: 1, count: 25 },
      { rating: 2, count: 45 },
      { rating: 3, count: 120 },
      { rating: 4, count: 280 },
      { rating: 5, count: 530 }
    ],
    averageRating: 4.1,
    totalResponses: 1000,
    maxRating: 5,
    responseTime: '2.1 min promedio'
  };

  // Datos mock para Preference Test (3.6)
  const mockPreferenceTestData = {
    question: '¿Qué diseño de interfaz prefieres?',
    description: 'Selecciona el diseño que más te guste',
    options: [
      { id: '1', name: 'Diseño Minimalista', image: '/api/placeholder/150/100', selected: 320, percentage: 32, color: '#3B82F6' },
      { id: '2', name: 'Diseño Colorido', image: '/api/placeholder/150/100', selected: 280, percentage: 28, color: '#10B981' },
      { id: '3', name: 'Diseño Corporativo', image: '/api/placeholder/150/100', selected: 250, percentage: 25, color: '#F59E0B' },
      { id: '4', name: 'Diseño Moderno', image: '/api/placeholder/150/100', selected: 150, percentage: 15, color: '#EF4444' }
    ],
    totalSelections: 1000,
    totalParticipants: 1000,
    responseTime: '3.2 min promedio',
    preferenceAnalysis: 'El diseño minimalista es claramente el preferido, seguido por el diseño colorido.'
  };

  // Datos mock para Image Selection (3.8)
  const mockImageSelectionData = {
    question: '¿Qué imagen representa mejor la marca?',
    description: 'Selecciona la imagen que mejor represente nuestra marca',
    images: [
      { id: '1', name: 'Logo Clásico', imageUrl: '/api/placeholder/200/150', selected: 450, percentage: 45, category: 'Clásico' },
      { id: '2', name: 'Logo Moderno', imageUrl: '/api/placeholder/200/150', selected: 320, percentage: 32, category: 'Moderno' },
      { id: '3', name: 'Logo Minimalista', imageUrl: '/api/placeholder/200/150', selected: 180, percentage: 18, category: 'Minimalista' },
      { id: '4', name: 'Logo Colorido', imageUrl: '/api/placeholder/200/150', selected: 50, percentage: 5, category: 'Colorido' }
    ],
    totalSelections: 1000,
    totalParticipants: 1000,
    responseTime: '2.8 min promedio',
    selectionAnalysis: 'El logo clásico es la opción más seleccionada, seguido por el logo moderno.',
    categories: [
      { name: 'Clásico', count: 450 },
      { name: 'Moderno', count: 320 },
      { name: 'Minimalista', count: 180 },
      { name: 'Colorido', count: 50 }
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

      {/* Pregunta de escala lineal */}
      <QuestionContainer
        questionId="3.4.- Linear Scale"
        questionType="Linear Scale"
        conditionalityDisabled={false}
        required={true}
        hasNewData={true}
        viewType="linear_scale"
        linearScaleData={mockLinearScaleData}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Pregunta de rating */}
      <QuestionContainer
        questionId="3.5.- Rating"
        questionType="Rating"
        conditionalityDisabled={false}
        required={true}
        hasNewData={false}
        viewType="rating"
        ratingData={mockRatingData}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Pregunta de test de preferencia */}
      <QuestionContainer
        questionId="3.6.- Preference Test"
        questionType="Preference Test"
        conditionalityDisabled={false}
        required={true}
        hasNewData={true}
        viewType="preference"
        preferenceTestData={mockPreferenceTestData}
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

      {/* Pregunta de selección de imágenes */}
      <QuestionContainer
        questionId="3.8.- Image Selection"
        questionType="Image Selection"
        conditionalityDisabled={false}
        required={true}
        hasNewData={false}
        viewType="image_selection"
        imageSelectionData={mockImageSelectionData}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />
    </div>
  );
};
