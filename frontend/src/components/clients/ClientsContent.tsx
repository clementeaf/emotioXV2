'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BenchmarkChart } from '@/components/clients/BenchmarkChart';
import { BestPerformer } from '@/components/clients/BestPerformer';
import { ClientSelector } from '@/components/clients/ClientSelector';
import { HelpSection } from '@/components/clients/HelpSection';
import { ResearchList } from '@/components/clients/ResearchList';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { researchAPI } from '@/lib/api';
import {
  adaptResearchData,
  filterResearchByClient,
  findBestResearch,
  type BestResearchData
} from '@/utils/research';

export const ClientsContent = () => {
  const searchParams = useSearchParams();
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

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar className="w-64 flex-shrink-0" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="h-full p-6">
            <div className="mb-6">
              <ClientSelector onClientChange={handleClientChange} />
            </div>

            {isLoadingResearch && (
              <LoadingSpinner message="Cargando datos de investigación..." />
            )}

            {!isLoadingResearch && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <BenchmarkChart />
                  <ResearchList data={researchData} />
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
