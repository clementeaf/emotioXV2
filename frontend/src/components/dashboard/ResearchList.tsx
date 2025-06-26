'use client';

import Link from 'next/link';

import { ResearchTable } from '@/components/dashboard/ResearchTable';

const ResearchList = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Investigaciones</h2>
        <Link
          href="/dashboard/research/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Nueva Investigación
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-neutral-200">
        <ResearchTable />
      </div>
    </div>
  );
};

export default ResearchList;
