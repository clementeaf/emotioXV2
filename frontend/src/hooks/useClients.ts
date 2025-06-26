import { useQuery } from '@tanstack/react-query';

import { researchAPI } from '@/lib/api';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'active' | 'inactive';
  researchCount: number;
  lastActivity: string;
}

interface Research {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  participants: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface UseClientsReturn {
  clients: Client[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
}

export const useClients = (): UseClientsReturn => {
  const {
    data: clients = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      try {
        const response = await researchAPI.list();
        const research = response.data || [];

        // Extraer clientes únicos de las investigaciones
        const clientsMap = new Map<string, Client>();

        research.forEach((item: any) => {
          const clientName = item.enterprise || item.basic?.enterprise;
          if (clientName && !clientsMap.has(clientName)) {
            clientsMap.set(clientName, {
              id: clientName,
              name: clientName,
              email: '',
              company: clientName,
              status: 'active' as const,
              researchCount: 1,
              lastActivity: new Date().toISOString()
            });
          }
        });

        const uniqueClients = Array.from(clientsMap.values());

        // Si no hay clientes en las investigaciones, devolver datos por defecto
        if (uniqueClients.length === 0) {
          return [
            {
              id: '1',
              name: 'Universidad del Desarrollo',
              email: 'contacto@udd.cl',
              company: 'Universidad del Desarrollo',
              status: 'active' as const,
              researchCount: 5,
              lastActivity: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Cliente Demo',
              email: 'demo@cliente.com',
              company: 'Cliente Demo',
              status: 'active' as const,
              researchCount: 2,
              lastActivity: new Date().toISOString()
            }
          ];
        }

        return uniqueClients;
      } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });

  return {
    clients,
    isLoading,
    error,
    refetch
  };
};
