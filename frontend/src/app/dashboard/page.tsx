'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ResearchTable } from '@/components/dashboard/ResearchTable';
import { ResearchTypes } from '@/components/dashboard/ResearchTypes';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CreateResearchForm } from '@/components/research/CreateResearchForm';

function DashboardContent({ activeResearch }: { activeResearch?: { id: string; name: string } }) {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');
  const stage = searchParams.get('stage');

  // Si hay una investigación activa y estamos en una etapa específica
  if (activeResearch && section && stage) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">
              {section.charAt(0).toUpperCase() + section.slice(1)} - {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Configure your research settings for this stage.
            </p>
          </div>

          {/* Aquí irá el contenido específico de cada etapa */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <p className="text-neutral-600">Content for {section} - {stage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Si estamos en la página de crear nueva investigación
  if (searchParams.get('new')) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">Create New Research</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Fill in the details to create a new research project.
            </p>
          </div>

          <div className="max-w-3xl">
            <CreateResearchForm />
          </div>
        </div>
      </div>
    );
  }

  // Vista por defecto del dashboard
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Welcome back! Here's an overview of your research projects.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Research"
            value="52"
            icon={
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Projects"
            value="8"
            icon={
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Completed"
            value="44"
            icon={
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3">
            <ResearchTable />
          </div>
          <div>
            <ResearchTypes />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const researchId = searchParams.get('research');
  const [activeResearch, setActiveResearch] = useState(researchId ? { id: researchId, name: 'Research Project' } : undefined);

  const handleResearchCreated = (id: string, name: string) => {
    setActiveResearch({ id, name });
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar activeResearch={activeResearch} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <DashboardContent activeResearch={activeResearch} />
      </div>
    </div>
  );
} 