'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { BenchmarkChart } from '@/components/clients/BenchmarkChart';
import { BestPerformer } from '@/components/clients/BestPerformer';
import { ClientSelector } from '@/components/clients/ClientSelector';
import { ClientsResearchList } from '@/components/clients/ClientsResearchList';
import { HelpSection } from '@/components/clients/HelpSection';
import { Sidebar } from '@/components/layout/Sidebar';

import { researchAPI } from '@/lib/api';
import {
  adaptResearchData,
  filterResearchByClient,
  findBestResearch,
  type BestResearchData
} from '@/utils/research';

export const ClientsContent = () => {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const clientId = searchParams?.get('clientId');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId || null);

  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [clientId]);

  const { data: apiResearchData, isLoading: isLoadingResearch } = useQuery({
    queryKey: ['research', selectedClientId],
    queryFn: async () => {
      try {
        const response = await researchAPI.list();
        const research = response.data || [];
        return filterResearchByClient(research, selectedClientId);
      } catch (error) {
        console.error('Error loading research data:', error);
        return [];
      }
    },
    enabled: true
  });

  const researchData = useMemo(() => {
    return adaptResearchData(apiResearchData || []);
  }, [apiResearchData]);

  const bestResearch = useMemo((): BestResearchData | null => {
    return findBestResearch(apiResearchData || []);
  }, [apiResearchData]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleDuplicateSuccess = (newResearchId: string) => {
    // Invalidar cache para refrescar la lista
    queryClient.invalidateQueries({ queryKey: ['research', selectedClientId] });
    toast.success('Lista de investigaciones actualizada');
  };

  const handleDeleteSuccess = (deletedResearchId: string) => {
    // Invalidar cache para refrescar la lista
    queryClient.invalidateQueries({ queryKey: ['research', selectedClientId] });
    toast.success('Investigación eliminada de la lista');
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar className="w-64 flex-shrink-0" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="h-full p-6">
            <div className="mb-6">
              <ClientSelector onClientChange={handleClientChange} />
            </div>

            {!isLoadingResearch && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <BenchmarkChart />
                  <ClientsResearchList
                    data={researchData}
                    onDuplicateSuccess={handleDuplicateSuccess}
                    onDeleteSuccess={handleDeleteSuccess}
                  />
                </div>
                <div className="space-y-6">
                  <HelpSection />
                  {bestResearch && <BestPerformer data={bestResearch} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
