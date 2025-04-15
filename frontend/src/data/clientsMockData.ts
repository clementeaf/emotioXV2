// Datos mock para mostrar en la página de clientes

// Datos mock para las investigaciones
export const mockResearch = [
  {
    id: '1',
    name: 'Packaging Research 2023',
    enterprise: 'Coca-Cola',
    type: 'Packaging',
    date: '2023-05-12',
    score: 85,
    status: 'Completed',
    performance: {
      visual: 78,
      benefit: 82
    }
  },
  {
    id: '2',
    name: 'Brand Identity Evaluation',
    enterprise: 'Pepsi',
    type: 'Branding',
    date: '2023-04-20',
    score: 72,
    status: 'Completed',
    performance: {
      visual: 68,
      benefit: 76
    }
  },
  {
    id: '3',
    name: 'Digital Campaign Pre-test',
    enterprise: 'Nestlé',
    type: 'Digital',
    date: '2023-06-05',
    score: 91,
    status: 'Completed',
    performance: {
      visual: 92,
      benefit: 88
    }
  },
  {
    id: '4',
    name: 'Product Redesign Evaluation',
    enterprise: 'Unilever',
    type: 'Product',
    date: '2023-07-15',
    score: 77,
    status: 'In Progress',
    performance: {
      visual: 80,
      benefit: 74
    }
  }
];

// Datos mock para el mejor rendimiento
export const mockBestPerformer = {
  id: '3',
  name: 'Digital Campaign Pre-test',
  enterprise: 'Nestlé',
  score: 91,
  performance: {
    visual: 92,
    benefit: 88
  },
  insights: [
    'Strong visual appeal in all tested materials',
    'Clear benefit communication',
    'High emotional connection with target audience'
  ]
}; 