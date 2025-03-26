'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

interface ProgressMonitorFormProps {
  className?: string;
}

interface ProgressStats {
  complete: {
    count: number;
    percentage: number;
    goal: number;
  };
  disqualified: {
    count: number;
    percentage: number;
  };
  overquota: {
    count: number;
    percentage: number;
  };
}

interface DailyData {
  date: string;
  complete: number;
  disqualified: number;
  overquota: number;
}

export function ProgressMonitorForm({ className }: ProgressMonitorFormProps) {
  const [stats] = useState<ProgressStats>({
    complete: {
      count: 238,
      percentage: 57,
      goal: 500
    },
    disqualified: {
      count: 94,
      percentage: 24
    },
    overquota: {
      count: 25,
      percentage: 15
    }
  });

  const [dailyData] = useState<DailyData[]>([
    { date: '2023-06-01', complete: 15, disqualified: 6, overquota: 2 },
    { date: '2023-06-02', complete: 22, disqualified: 8, overquota: 3 },
    { date: '2023-06-03', complete: 28, disqualified: 12, overquota: 4 },
    { date: '2023-06-04', complete: 35, disqualified: 15, overquota: 2 },
    { date: '2023-06-05', complete: 42, disqualified: 18, overquota: 5 },
    { date: '2023-06-06', complete: 48, disqualified: 20, overquota: 6 },
    { date: '2023-06-07', complete: 48, disqualified: 15, overquota: 3 }
  ]);

  // Calcula el número total de respuestas
  const totalResponses = stats.complete.count + stats.disqualified.count + stats.overquota.count;
  
  // Tasas de conversión
  const conversionRates = {
    startToComplete: Math.round((stats.complete.count / totalResponses) * 100),
    startToDisqualify: Math.round((stats.disqualified.count / totalResponses) * 100),
    averageCompletionTime: '12:45'
  };

  return (
    <div className={cn('max-w-3xl mx-auto', className)}>
      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900">
              2.4 - Progress Monitor
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Track the progress and completion rates of your research.
            </p>
          </header>

          <div className="space-y-8">
            {/* Completion Stats */}
            <div>
              <h2 className="text-base font-medium mb-4">Completion Overview</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-500 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Complete</h3>
                      <p className="text-xs opacity-80">{stats.complete.count} IDs have been successful</p>
                    </div>
                    <span className="text-2xl font-semibold">{stats.complete.percentage}%</span>
                  </div>
                  <div className="mt-2 bg-white/20 rounded-full h-1">
                    <div className="bg-white h-1 rounded-full" style={{ width: `${stats.complete.percentage}%` }} />
                  </div>
                </div>
                <div className="bg-yellow-500 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Disqualified</h3>
                      <p className="text-xs opacity-80">{stats.disqualified.count} IDs have been rejected</p>
                    </div>
                    <span className="text-2xl font-semibold">{stats.disqualified.percentage}%</span>
                  </div>
                  <div className="mt-2 bg-white/20 rounded-full h-1">
                    <div className="bg-white h-1 rounded-full" style={{ width: `${stats.disqualified.percentage}%` }} />
                  </div>
                </div>
                <div className="bg-red-500 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Overquota</h3>
                      <p className="text-xs opacity-80">{stats.overquota.count} IDs have been redirected</p>
                    </div>
                    <span className="text-2xl font-semibold">{stats.overquota.percentage}%</span>
                  </div>
                  <div className="mt-2 bg-white/20 rounded-full h-1">
                    <div className="bg-white h-1 rounded-full" style={{ width: `${stats.overquota.percentage}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress to Goal */}
            <div>
              <h2 className="text-base font-medium mb-4">Progress to Goal</h2>
              <div className="p-4 border rounded-lg bg-neutral-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completed Responses</span>
                  <span className="text-sm">
                    <span className="font-medium">{stats.complete.count}</span> / {stats.complete.goal}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.complete.count / stats.complete.goal) * 100)}%` }} 
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-neutral-500">
                    {Math.round((stats.complete.count / stats.complete.goal) * 100)}% complete
                  </span>
                  <span className="text-xs text-neutral-500">
                    {stats.complete.goal - stats.complete.count} more needed
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Completion Chart */}
            <div>
              <h2 className="text-base font-medium mb-4">Daily Completion Trend</h2>
              <div className="border rounded-lg p-4">
                <div className="flex h-40 items-end space-x-2">
                  {dailyData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col-reverse h-32">
                        <div 
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${(day.complete / 50) * 100}%` }}
                        >
                          <div className="w-full text-center text-xs text-white py-1">
                            {day.complete}
                          </div>
                        </div>
                        <div 
                          className="w-full bg-yellow-500 rounded-t"
                          style={{ height: `${(day.disqualified / 50) * 100}%` }}
                        >
                          <div className="w-full text-center text-xs text-white py-1">
                            {day.disqualified}
                          </div>
                        </div>
                        <div 
                          className="w-full bg-red-500 rounded-t"
                          style={{ height: `${(day.overquota / 50) * 100}%` }}
                        >
                          <div className="w-full text-center text-xs text-white py-1">
                            {day.overquota}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs mt-2 text-neutral-500">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-4 space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                    <span>Complete</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                    <span>Disqualified</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    <span>Overquota</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Metrics */}
            <div>
              <h2 className="text-base font-medium mb-4">Key Performance Metrics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-neutral-500 mb-1">Completion Rate</div>
                  <div className="text-2xl font-semibold">{conversionRates.startToComplete}%</div>
                  <div className="text-xs text-neutral-500 mt-1">Start to Complete</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-neutral-500 mb-1">Disqualification Rate</div>
                  <div className="text-2xl font-semibold">{conversionRates.startToDisqualify}%</div>
                  <div className="text-xs text-neutral-500 mt-1">Start to Disqualify</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-neutral-500 mb-1">Avg. Completion Time</div>
                  <div className="text-2xl font-semibold">{conversionRates.averageCompletionTime}</div>
                  <div className="text-xs text-neutral-500 mt-1">Minutes:Seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">Last updated: Jun 7, 2023 at 14:30</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Export Data
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
} 