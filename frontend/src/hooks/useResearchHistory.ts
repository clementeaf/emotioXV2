import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ClientData {
  id: string;
  name: string;
}

export const useResearchHistory = () => {
  const searchParams = useSearchParams();
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  const clientParam = searchParams?.get('client');
  const clientId: string | null = clientParam || null;

  useEffect(() => {
    if (clientId) {
      setSelectedClient({
        id: clientId,
        name: `Cliente ${clientId}`
      });
    } else {
      setSelectedClient(null);
    }
  }, [clientId]);

  return {
    selectedClient,
    clientId
  };
};
