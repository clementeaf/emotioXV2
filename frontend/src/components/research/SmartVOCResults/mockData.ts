export const mockData = {
  cpv: 85,
  cpvTrend: [
    { date: '2024-01', value: 80 },
    { date: '2024-02', value: 82 },
    { date: '2024-03', value: 85 },
    { date: '2024-04', value: 83 },
    { date: '2024-05', value: 87 },
    { date: '2024-06', value: 85 }
  ],
  trustFlow: [
    { stage: 'Awareness', value: 100 },
    { stage: 'Consideration', value: 75 },
    { stage: 'Purchase', value: 60 },
    { stage: 'Retention', value: 85 },
    { stage: 'Advocacy', value: 70 }
  ],
  emotionalStates: {
    states: [
      { emotion: 'Happy', percentage: 45 },
      { emotion: 'Neutral', percentage: 30 },
      { emotion: 'Frustrated', percentage: 15 },
      { emotion: 'Excited', percentage: 10 }
    ],
    longTermClusters: [
      { cluster: 'Satisfied', count: 120 },
      { cluster: 'Neutral', count: 80 },
      { cluster: 'Dissatisfied', count: 40 }
    ],
    shortTermClusters: [
      { cluster: 'Engaged', count: 90 },
      { cluster: 'Confused', count: 60 },
      { cluster: 'Delighted', count: 70 }
    ]
  },
  questionResults: [
    {
      questionNumber: 1,
      question: '¿Cómo calificarías tu experiencia general?',
      responses: [
        { label: 'Muy mala', count: 5, percentage: 5 },
        { label: 'Mala', count: 10, percentage: 10 },
        { label: 'Neutral', count: 25, percentage: 25 },
        { label: 'Buena', count: 40, percentage: 40 },
        { label: 'Excelente', count: 20, percentage: 20 }
      ]
    },
    {
      questionNumber: 2,
      question: '¿Recomendarías nuestro producto?',
      responses: [
        { label: 'Definitivamente no', count: 8, percentage: 8 },
        { label: 'Probablemente no', count: 12, percentage: 12 },
        { label: 'Tal vez', count: 30, percentage: 30 },
        { label: 'Probablemente sí', count: 35, percentage: 35 },
        { label: 'Definitivamente sí', count: 15, percentage: 15 }
      ]
    }
  ],
  csat: {
    score: 75,
    data: [
      { date: '2024-01', satisfied: 70, dissatisfied: 30 },
      { date: '2024-02', satisfied: 72, dissatisfied: 28 },
      { date: '2024-03', satisfied: 75, dissatisfied: 25 },
      { date: '2024-04', satisfied: 73, dissatisfied: 27 },
      { date: '2024-05', satisfied: 77, dissatisfied: 23 },
      { date: '2024-06', satisfied: 75, dissatisfied: 25 }
    ]
  },
  ces: {
    score: 65,
    data: [
      { date: '2024-01', satisfied: 60, dissatisfied: 40 },
      { date: '2024-02', satisfied: 62, dissatisfied: 38 },
      { date: '2024-03', satisfied: 65, dissatisfied: 35 },
      { date: '2024-04', satisfied: 63, dissatisfied: 37 },
      { date: '2024-05', satisfied: 67, dissatisfied: 33 },
      { date: '2024-06', satisfied: 65, dissatisfied: 35 }
    ]
  },
  cv: {
    score: 80,
    data: [
      { date: '2024-01', satisfied: 75, dissatisfied: 25 },
      { date: '2024-02', satisfied: 77, dissatisfied: 23 },
      { date: '2024-03', satisfied: 80, dissatisfied: 20 },
      { date: '2024-04', satisfied: 78, dissatisfied: 22 },
      { date: '2024-05', satisfied: 82, dissatisfied: 18 },
      { date: '2024-06', satisfied: 80, dissatisfied: 20 }
    ]
  }
};
