// Mock data para demostración en la página de clientes

// Interfaces para los tipos de datos
export interface ResearchItem {
  id: string;
  name: string;
  status: 'completed' | 'in_progress';
  progress: number;
  date: string;
  researcher: string;
}

export interface BestPerformerItem {
  id: string;
  title: string;
  imageUrl: string;
  score: number;
  researchId: string;
}

export interface ClientItem {
  id: string;
  name: string;
}

// Datos de investigación
export const mockResearch: ResearchItem[] = [
  {
    id: '1',
    name: 'Eye Tracking Study #1',
    status: 'completed',
    progress: 100,
    date: '2024-02-20',
    researcher: 'John Doe'
  },
  {
    id: '2',
    name: 'Visual Attention Analysis',
    status: 'in_progress',
    progress: 65,
    date: '2024-02-25',
    researcher: 'Jane Smith'
  }
];

// Datos del mejor desempeño
export const mockBestPerformer: BestPerformerItem = {
  id: '1',
  title: 'Product Design A',
  imageUrl: '/placeholder.jpg',
  score: 95,
  researchId: '1'
};

// Datos de clientes
export const mockClients: ClientItem[] = [
  { id: '1', name: 'Acme Corporation' },
  { id: '2', name: 'Globex Industries' },
  { id: '3', name: 'Stark Enterprises' }
]; 