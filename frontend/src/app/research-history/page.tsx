'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { ClientSelector } from '@/components/research-history/ClientSelector';
import { PerceivedValueChart } from '@/components/research-history/PerceivedValueChart';
import { ClientInfo } from '@/components/research-history/ClientInfo';
import { ResearchList } from '@/components/research-history/ResearchList';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function ResearchHistoryContent() {
  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Client Selector Section */}
            <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-4">
              <ClientSelector />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Perceived Value Chart Section */}
              <div className="col-span-8">
                <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-6">
                  <h2 className="text-base font-medium text-neutral-900 mb-4">Research&apos;s History</h2>
                  <PerceivedValueChart />
                </div>
              </div>

              {/* Client Info Section */}
              <div className="col-span-4">
                <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-6">
                  <h2 className="text-base font-medium text-neutral-900 mb-4">Who is</h2>
                  <ClientInfo />
                </div>
              </div>

              {/* Research List Section */}
              <div className="col-span-12">
                <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-100">
                    <h2 className="text-base font-medium text-neutral-900">List of Research</h2>
                  </div>
                  <ResearchList />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ResearchHistoryPage() {
  return (
    <ErrorBoundary>
      <ResearchHistoryContent />
    </ErrorBoundary>
  );
} 