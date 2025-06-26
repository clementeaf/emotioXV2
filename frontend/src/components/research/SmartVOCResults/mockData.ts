import { MockData } from './types';

export const mockData: MockData = {
  cpv: 71.89,
  cpvTrend: [
    { date: 'Day 1', value: 30 },
    { date: 'Day 2', value: 40 },
    { date: 'Day 3', value: 35 },
    { date: 'Day 4', value: 50 },
    { date: 'Day 5', value: 83.62 },
    { date: 'Day 6', value: 70 },
    { date: 'Day 7', value: 65 },
    { date: 'Day 8', value: 50 },
  ],
  csat: {
    score: 59.63,
    data: [
      { date: 'Day 1', satisfied: 80, dissatisfied: 20 },
      { date: 'Day 3', satisfied: 55, dissatisfied: 40 },
      { date: 'Day 5', satisfied: 20, dissatisfied: 10 },
      { date: 'Day 7', satisfied: 10, dissatisfied: 5 },
    ],
  },
  ces: {
    score: 55.25,
    data: [
      { date: 'Day 1', satisfied: 20, dissatisfied: 50 },
      { date: 'Day 3', satisfied: 100, dissatisfied: 20 },
      { date: 'Day 5', satisfied: 100, dissatisfied: 10 },
      { date: 'Day 7', satisfied: 30, dissatisfied: 5 },
    ],
  },
  cv: {
    score: 48.42,
    data: [
      { date: 'Day 1', satisfied: 80, dissatisfied: 45 },
      { date: 'Day 3', satisfied: 15, dissatisfied: 0 },
      { date: 'Day 5', satisfied: 40, dissatisfied: 15 },
      { date: 'Day 7', satisfied: 80, dissatisfied: 35 },
    ],
  },
  trustFlow: [
    { hour: '00', nps: 45, nev: 52 },
    { hour: '03', nps: 78, nev: 48 },
    { hour: '06', nps: 82, nev: 45 },
    { hour: '09', nps: 75, nev: 50 },
    { hour: '12', nps: 68, nev: 42 },
    { hour: '15', nps: 62, nev: 38 },
    { hour: '18', nps: 58, nev: 35 },
    { hour: '21', nps: 48, nev: 65 },
    { hour: '23', nps: 42, nev: 72 },
  ],
  questionResults: [
    {
      questionNumber: '2.1',
      title: 'Customer Satisfaction Score (CSAT)',
      type: 'Linear Scale question',
      conditionality: 'Conditionality disabled',
      required: true,
      question: 'How would you rate your overall satisfaction level with [company]?',
      responses: {
        count: 28635,
        timeAgo: '26s'
      },
      score: 53,
      distribution: [
        {
          label: 'Promoters',
          percentage: 70,
          color: 'green'
        },
        {
          label: 'Neutrals',
          percentage: 10,
          color: 'gray'
        },
        {
          label: 'Detractors',
          percentage: 20,
          color: 'red'
        }
      ]
    },
    {
      questionNumber: '2.2',
      title: 'Customer Effort Score (CES)',
      type: 'Linear Scale question',
      conditionality: 'Conditionality disabled',
      required: true,
      question: 'It was easy for me to handle my issue today',
      responses: {
        count: 24625,
        timeAgo: '26s'
      },
      score: 45,
      distribution: [
        {
          label: 'Little effort',
          percentage: 70,
          color: 'green'
        },
        {
          label: 'Neutrals',
          percentage: 10,
          color: 'gray'
        },
        {
          label: 'Much effort',
          percentage: 20,
          color: 'red'
        }
      ]
    },
    {
      questionNumber: '2.3',
      title: 'Cognitive Value (CV)',
      type: 'Linear Scale question',
      conditionality: 'Conditionality disabled',
      required: true,
      question: 'This was the best app my eyes had see',
      responses: {
        count: 31162,
        timeAgo: '26s'
      },
      score: 61,
      distribution: [
        {
          label: 'Worth',
          percentage: 70,
          color: 'green'
        },
        {
          label: 'Neutrals',
          percentage: 10,
          color: 'gray'
        },
        {
          label: 'Worthless',
          percentage: 20,
          color: 'red'
        }
      ]
    },
  ],
  emotionalStates: {
    states: [
      { name: 'Feliz', value: 6, isPositive: true },
      { name: 'Satisfecho', value: 9, isPositive: true },
      { name: 'Confiado', value: 9, isPositive: true },
      { name: 'Valorado', value: 4, isPositive: true },
      { name: 'Cuidado', value: 4, isPositive: true },
      { name: 'Seguro', value: 9, isPositive: true },
      { name: 'Entendido', value: 9, isPositive: true },
      { name: 'Inteligente', value: 3, isPositive: true },
      { name: 'Estimulado', value: 3, isPositive: true },
      { name: 'Exploratorio', value: 7, isPositive: true },
      { name: 'Interesado', value: 7, isPositive: true },
      { name: 'Energico', value: 8, isPositive: true },
      { name: 'Descontento', value: 10, isPositive: false },
      { name: 'Frustrado', value: 10, isPositive: false },
      { name: 'Irritado', value: 3, isPositive: false },
      { name: 'Decepción', value: 3, isPositive: false },
      { name: 'Estresado', value: 2, isPositive: false },
      { name: 'Infeliz', value: 2, isPositive: false },
      { name: 'Desatendido', value: 7, isPositive: false }
    ],
    longTermClusters: [
      { name: 'Advocacy', value: 70.5, trend: 'up' },
      { name: 'Recommendation', value: 50.5, trend: 'down' },
      { name: 'Attention', value: 23.5, trend: 'up' },
      { name: 'Destroying', value: 36.5, trend: 'down' }
    ],
    shortTermClusters: [
      { name: 'Attention', value: 23.5, trend: 'up' },
      { name: 'Destroying', value: 36.5, trend: 'down' }
    ]
  }
}; 