'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default function ResearchPage() {
  const mockStats = [
    { label: 'Total Participants', value: '1,234' },
    { label: 'Average Age', value: '32' },
    { label: 'Gender Distribution', value: '54% F / 46% M' },
    { label: 'Completion Rate', value: '87%' },
  ];

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-neutral-900">Research Overview</h1>
              <p className="mt-2 text-sm text-neutral-600">
                Comprehensive view of all research activities and metrics
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              {mockStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg border border-neutral-200"
                >
                  <p className="text-sm font-medium text-neutral-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-neutral-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Research Categories */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Research by Type</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Eye Tracking</span>
                    <div className="flex items-center">
                      <div className="w-48 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <span className="ml-3 text-sm text-neutral-600">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Cognitive Analysis</span>
                    <div className="flex items-center">
                      <div className="w-48 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <span className="ml-3 text-sm text-neutral-600">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Attention Prediction</span>
                    <div className="flex items-center">
                      <div className="w-48 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <span className="ml-3 text-sm text-neutral-600">10%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'New research started', time: '2 hours ago' },
                    { action: 'Data collection completed', time: '5 hours ago' },
                    { action: 'Analysis report generated', time: '1 day ago' },
                    { action: 'Participant milestone reached', time: '2 days ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-900">{activity.action}</span>
                      <span className="text-xs text-neutral-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 