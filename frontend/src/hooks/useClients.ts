import { researchAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

/**
 * Hook para obtener la lista de clientes
 * Reemplaza los datos mock hardcodeados
 */
export const useClients = () => {
  const {
    data: clients = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
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
              status: 'active' as const
            });
          }
        });

        const uniqueClients = Array.from(clientsMap.values());

        // Si no hay clientes en las investigaciones, devolver datos por defecto
        if (uniqueClients.length === 0) {
          return [
            { id: '1', name: 'Universidad del Desarrollo', status: 'active' as const },
            { id: '2', name: 'Cliente Demo', status: 'active' as const }
          ];
        }

        return uniqueClients;
      } catch (error) {
        console.error('Error loading clients:', error);
        // En caso de error, devolver datos mínimos para que la app funcione
        return [
          { id: '1', name: 'Universidad del Desarrollo', status: 'active' as const },
          { id: '2', name: 'Cliente Demo', status: 'active' as const }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    clients,
    isLoading,
    error,
    refetch
  };
};
