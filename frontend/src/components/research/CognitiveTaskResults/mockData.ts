import { CognitiveTaskResult, CognitiveSummary, FilterSection, VisualizationData, ScatterDataPoint, ClusterGroup, CognitiveTaskQuestion, SentimentResult, ThemeResult, KeywordResult } from './types';

// Datos de ejemplo para análisis de tareas cognitivas
export const cognitiveTaskQuestion: CognitiveTaskQuestion = {
  id: '3.1',
  questionNumber: '3.1',
  questionText: 'Question',
  questionType: 'short_text',
  required: true,
  conditionalityDisabled: true,
  newData: true,
  sentimentResults: [
    { id: '1', text: 'Comment', sentiment: 'neutral', type: 'comment' },
    { id: '2', text: 'Camera lens working memory in...', sentiment: 'positive' },
    { id: '3', text: 'Laptop, Camera lens memory in...', sentiment: 'positive' },
    { id: '4', text: 'Mobile', sentiment: 'positive' },
    { id: '5', text: 'Camera lens', sentiment: 'positive', selected: true },
    { id: '6', text: 'Computer accessories', sentiment: 'positive' },
    { id: '7', text: 'TV, Camera lens working memory in...', sentiment: 'positive' },
    { id: '8', text: 'Mobile, lens working memory in...', sentiment: 'positive' },
    { id: '9', text: 'Laptop', sentiment: 'green' },
    { id: '10', text: 'Camera lens working memory in...', sentiment: 'green' },
    { id: '11', text: 'Camera lens working memory in...', sentiment: 'green' },
  ],
  themes: [
    { id: 't1', name: 'Memory', count: 12 },
    { id: 't2', name: 'Learning', count: 8 },
    { id: 't3', name: 'Education', count: 7 }
  ],
  keywords: [
    { id: 'k1', name: 'Working memory', count: 15 },
    { id: 'k2', name: 'Cognitive', count: 10 },
    { id: 'k3', name: 'Development', count: 8 }
  ],
  sentimentAnalysis: {
    text: 'Then I explore the nature of cognitive developmental improvements in working memory, the role of working memory in learning, and some potential implications of working memory and its development for the education of children and adults.\n\nThe use of working memory is quite ubiquitous in human thought, but the best way to improve education using what we know about working memory is still controversial. I hope to provide some directions for research and educational practice.',
    actionables: [
      'Using what we know about working memory is still controversial.',
      'I hope to provide some directions for research and educational practice.'
    ]
  }
};

// Datos de ejemplo para la pregunta 3.2 (Long Text question)
export const cognitiveTaskQuestion2: CognitiveTaskQuestion = {
  id: '3.2',
  questionNumber: '3.2',
  questionText: 'Question',
  questionType: 'long_text',
  required: true,
  conditionalityDisabled: true,
  newData: true,
  sentimentResults: [
    { id: '1', text: 'Comment', sentiment: 'neutral', type: 'comment' },
    { id: '2', text: 'Camera lens working memory in...', sentiment: 'positive' },
    { id: '3', text: 'Laptop, Camera lens memory in...', sentiment: 'positive' },
    { id: '4', text: 'Mobile', sentiment: 'positive' },
    { id: '5', text: 'Camera lens', sentiment: 'positive', selected: true },
    { id: '6', text: 'Computer accessories', sentiment: 'positive' },
    { id: '7', text: 'TV, Camera lens working memory in...', sentiment: 'positive' },
    { id: '8', text: 'Mobile, lens working memory in...', sentiment: 'positive' },
    { id: '9', text: 'Laptop', sentiment: 'green' },
    { id: '10', text: 'Camera lens working memory in...', sentiment: 'green' },
    { id: '11', text: 'Camera lens working memory in...', sentiment: 'green' },
  ],
  themes: [
    { id: 't1', name: 'Memory', count: 12 },
    { id: 't2', name: 'Learning', count: 8 },
    { id: 't3', name: 'Education', count: 7 },
    { id: 't4', name: 'Cognitive Analysis', count: 10 },
    { id: 't5', name: 'Neural Networks', count: 5 }
  ],
  keywords: [
    { id: 'k1', name: 'Working memory', count: 15 },
    { id: 'k2', name: 'Cognitive', count: 10 },
    { id: 'k3', name: 'Development', count: 8 },
    { id: 'k4', name: 'Learning patterns', count: 12 },
    { id: 'k5', name: 'Education', count: 9 }
  ],
  sentimentAnalysis: {
    text: 'Then I explore the nature of cognitive developmental improvements in working memory, the role of working memory in learning, and some potential implications of working memory and its development for the education of children and adults.\n\nThe use of working memory is quite ubiquitous in human thought, but the best way to improve education using what we know about working memory is still controversial. I hope to provide some directions for research and educational practice.',
    actionables: [
      'Using what we know about working memory is still controversial.',
      'I hope to provide some directions for research and educational practice.'
    ]
  }
};

// Datos de resumen para las tarjetas principales
export const summaryData: CognitiveSummary = {
  averagePerformance: {
    value: 78,
    trend: 2.5,
    trendDirection: 'up',
    comparisonText: 'vs. promedio de grupo'
  },
  completionRate: {
    value: 92,
    trend: 3.8,
    trendDirection: 'up',
    comparisonText: 'vs. promedio histórico'
  },
  averageTime: {
    value: '4:32',
    trend: 12, // Representa segundos adicionales
    trendDirection: 'down',
    comparisonText: 'vs. última evaluación'
  },
  errorRate: {
    value: 13,
    trend: 2.1,
    trendDirection: 'down',
    comparisonText: 'vs. promedio de grupo'
  }
};

// Datos simulados para los resultados de tareas cognitivas
export const cognitiveResults: CognitiveTaskResult[] = [
  {
    id: '1',
    taskName: 'Memoria de trabajo',
    taskDescription: 'Evaluación de la capacidad para mantener y manipular información a corto plazo.',
    completed: 245,
    totalParticipants: 256,
    score: 78,
    maxScore: 100,
    averageTime: '3:45',
    status: 'completed',
    trendVsControl: 3.2,
    subtasks: [
      { name: 'Recordar secuencia visual', score: 82, percentage: 82 },
      { name: 'Manipulación mental de objetos', score: 76, percentage: 76 },
      { name: 'Memoria numérica inversa', score: 73, percentage: 73 },
      { name: 'Actualización de información', score: 81, percentage: 81 }
    ],
    heatmapUrl: '/images/cognitive/memory-heatmap.jpg'
  },
  {
    id: '2',
    taskName: 'Atención selectiva',
    taskDescription: 'Mide la capacidad de enfocarse en estímulos relevantes mientras se ignoran distracciones.',
    completed: 238,
    totalParticipants: 256,
    score: 84,
    maxScore: 100,
    averageTime: '2:58',
    status: 'completed',
    trendVsControl: 2.8,
    subtasks: [
      { name: 'Búsqueda visual', score: 86, percentage: 86 },
      { name: 'Identificación de estímulos', score: 84, percentage: 84 },
      { name: 'Filtrado de distracciones', score: 81, percentage: 81 }
    ],
    heatmapUrl: '/images/cognitive/attention-heatmap.jpg'
  },
  {
    id: '3',
    taskName: 'Velocidad de procesamiento',
    taskDescription: 'Evalúa la rapidez con la que se procesa información visual y se toman decisiones.',
    completed: 230,
    totalParticipants: 256,
    score: 76,
    maxScore: 100,
    averageTime: '5:12',
    status: 'completed',
    trendVsControl: 1.5,
    subtasks: [
      { name: 'Tiempo de reacción simple', score: 79, percentage: 79 },
      { name: 'Comparación de símbolos', score: 74, percentage: 74 },
      { name: 'Codificación visual', score: 72, percentage: 72 },
      { name: 'Velocidad de escaneo', score: 78, percentage: 78 }
    ]
  },
  {
    id: '4',
    taskName: 'Flexibilidad cognitiva',
    taskDescription: 'Mide la capacidad de adaptar el comportamiento y pensamiento a nuevas situaciones o reglas.',
    completed: 235,
    totalParticipants: 256,
    score: 71,
    maxScore: 100,
    averageTime: '4:30',
    status: 'completed',
    trendVsControl: -1.2,
    subtasks: [
      { name: 'Cambio de reglas', score: 70, percentage: 70 },
      { name: 'Adaptación contextual', score: 73, percentage: 73 },
      { name: 'Categorización flexible', score: 69, percentage: 69 }
    ],
    heatmapUrl: '/images/cognitive/flexibility-heatmap.jpg'
  },
  {
    id: '5',
    taskName: 'Razonamiento lógico',
    taskDescription: 'Evalúa la capacidad de resolver problemas mediante el análisis y la lógica.',
    completed: 228,
    totalParticipants: 256,
    score: 81,
    maxScore: 100,
    averageTime: '6:15',
    status: 'completed',
    trendVsControl: 4.0,
    subtasks: [
      { name: 'Patrones visuales', score: 83, percentage: 83 },
      { name: 'Secuencias lógicas', score: 80, percentage: 80 },
      { name: 'Analogías', score: 79, percentage: 79 }
    ]
  }
];

// Datos para filtros
export const filterSections: FilterSection[] = [
  {
    id: 'task-type',
    title: 'Tipo de tarea',
    type: 'checkbox',
    initialVisibleItems: 3,
    options: [
      { id: 'memory', name: 'Memoria de trabajo', value: 'memory', count: 245 },
      { id: 'attention', name: 'Atención selectiva', value: 'attention', count: 238 },
      { id: 'processing', name: 'Velocidad de procesamiento', value: 'processing', count: 230 },
      { id: 'flexibility', name: 'Flexibilidad cognitiva', value: 'flexibility', count: 235 },
      { id: 'reasoning', name: 'Razonamiento lógico', value: 'reasoning', count: 228 }
    ]
  },
  {
    id: 'age-range',
    title: 'Rango de edad',
    type: 'checkbox',
    initialVisibleItems: 3,
    options: [
      { id: '18-24', name: '18-24 años', value: '18-24', count: 68 },
      { id: '25-34', name: '25-34 años', value: '25-34', count: 84 },
      { id: '35-44', name: '35-44 años', value: '35-44', count: 56 },
      { id: '45-54', name: '45-54 años', value: '45-54', count: 32 },
      { id: '55+', name: '55+ años', value: '55+', count: 16 }
    ]
  },
  {
    id: 'gender',
    title: 'Género',
    type: 'checkbox',
    options: [
      { id: 'male', name: 'Masculino', value: 'male', count: 125 },
      { id: 'female', name: 'Femenino', value: 'female', count: 130 },
      { id: 'non-binary', name: 'No binario', value: 'non-binary', count: 1 }
    ]
  },
  {
    id: 'completion-status',
    title: 'Estado de finalización',
    type: 'radio',
    options: [
      { id: 'all', name: 'Todos', value: 'all', count: 256 },
      { id: 'completed', name: 'Completado', value: 'completed', count: 245 },
      { id: 'in-progress', name: 'En progreso', value: 'in-progress', count: 8 },
      { id: 'pending', name: 'Pendiente', value: 'pending', count: 3 }
    ]
  },
  {
    id: 'score-range',
    title: 'Rango de puntuación',
    type: 'range',
    options: [
      { id: 'score-range', name: 'Puntuación', value: '0-100' }
    ]
  }
];

// Función para generar datos de dispersión aleatorios
export const generateScatterData = (): ScatterDataPoint[] => {
  return Array.from({ length: 100 }, () => ({
    x: Math.floor(Math.random() * 100), 
    y: Math.floor(Math.random() * 100),
    cluster: Math.floor(Math.random() * 3)
  }));
};

// Definición de clusters para visualizaciones
export const clusterGroups: ClusterGroup[] = [
  { id: 0, name: 'Grupo A', color: '#3B82F6' }, // blue-500
  { id: 1, name: 'Grupo B', color: '#8B5CF6' }, // purple-500
  { id: 2, name: 'Grupo C', color: '#EC4899' }  // pink-500
];

// Datos para gráficos de dispersión predefinidos
export const scatterData = {
  attentionScores: generateScatterData(),
  memoryScores: generateScatterData(),
  processingScores: generateScatterData()
};

// Datos para visualizaciones
export const visualizationData: VisualizationData[] = [
  {
    type: 'scatter',
    title: 'Relación entre velocidad y precisión',
    description: 'Distribución de resultados mostrando la relación entre velocidad de procesamiento y precisión en las respuestas',
    data: scatterData.processingScores,
    clusters: clusterGroups,
    xAxisLabel: 'Velocidad de procesamiento',
    yAxisLabel: 'Precisión'
  },
  {
    type: 'heatmap',
    title: 'Mapa de atención',
    description: 'Patrón de observación durante las tareas',
    data: Array.from({ length: 25 }).map(() => ({
      x: Math.floor(Math.random() * 5),
      y: Math.floor(Math.random() * 5),
      intensity: Math.random()
    }))
  }
]; 