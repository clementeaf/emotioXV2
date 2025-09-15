'use client';

import React from 'react';
import { Filters } from '../SmartVOCResults/Filters';

interface ResumeFormProps {
  researchId: string;
}

export const ResumeForm: React.FC<ResumeFormProps> = ({
  researchId // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Analytic Overview from average research's projects</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Visual Attractiveness */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-600">Visual Attractiveness</h4>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">↗ 4.12%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-4">45,4</div>
              <div className="h-20 bg-gradient-to-t from-blue-100 to-blue-200 rounded relative overflow-hidden">
                {/* Simulated bar chart */}
                <div className="absolute bottom-0 left-0 w-full">
                  <div className="flex items-end justify-between h-16 px-2">
                    {[40, 60, 30, 80, 45, 70, 35, 90, 55, 40, 65, 25].map((height, i) => (
                      <div
                        key={i}
                        className="bg-blue-500 w-1 rounded-t"
                        style={{ height: `${(height / 100) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit Association */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-600">Benefit Association</h4>
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">↘ 2.15%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-4">38,2</div>
              <div className="h-20 bg-gradient-to-t from-red-100 to-red-200 rounded relative overflow-hidden">
                {/* Simulated line chart */}
                <div className="absolute inset-0 flex items-center">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path
                      d="M5,20 Q20,15 35,18 T65,22 Q80,20 95,25"
                      stroke="#ef4444"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Winner option's rank position */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-600">Winner option's rank position</h4>
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">~ Average</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-4">8/17</div>
              <div className="h-20 bg-gradient-to-t from-orange-100 to-orange-200 rounded relative overflow-hidden">
                {/* Simulated bar chart */}
                <div className="absolute bottom-0 left-0 w-full">
                  <div className="flex items-end justify-between h-16 px-2">
                    {[65, 45, 80, 35, 70, 50, 85, 40, 75, 30, 60, 90].map((height, i) => (
                      <div
                        key={i}
                        className="bg-orange-500 w-1 rounded-t"
                        style={{ height: `${(height / 100) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Client's benchmark */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-600">Client's benchmark</h4>
                <div className="flex items-center">
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2">✏ Project 2024</span>
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900 mb-4">Update now</div>
              <div className="h-20 bg-gradient-to-t from-blue-100 to-blue-200 rounded relative overflow-hidden">
                {/* Simulated area chart */}
                <div className="absolute inset-0">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path
                      d="M5,30 Q20,25 35,28 T65,32 Q80,28 95,35 L95,40 L5,40 Z"
                      fill="#3b82f6"
                      fillOpacity="0.3"
                    />
                    <path
                      d="M5,30 Q20,25 35,28 T65,32 Q80,28 95,35"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screener Data Analysis Section */}
      <div className="flex gap-8 mt-8">
        <div className="flex-1">
          {/* Screener Analysis */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">1.0.- Screener</h2>
            <p className="text-sm text-gray-600 mb-6">
              Title of the screener section
            </p>
            <p className="text-sm text-gray-600 mb-8">
              Write a few questions, designed to weed out the folks who aren't your intended audience and capture the ones who are.
            </p>

            <div className="space-y-6">
              {/* Distribution and Stats Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution of users */}
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">Distribution of users</h3>
                      <p className="text-xs text-gray-500">Routing by ID</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">1297</div>
                    </div>
                  </div>

                  {/* Simulated bar chart */}
                  <div className="h-32 mb-4">
                    <div className="flex items-end justify-between h-full px-2">
                      {[85, 75, 65, 55, 45, 40, 35, 30, 25, 20, 15, 10].map((height, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            className={`w-4 rounded-t ${i < 8 ? 'bg-blue-500' : 'bg-gray-800'}`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center space-x-6 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                      <span>Route 1</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                      <span>Route 2</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-800 rounded mr-2"></div>
                      <span>Route 3</span>
                    </div>
                  </div>

                  {/* Assignment stats */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-100 rounded mr-3 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-600 rounded"></div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Best assignment day</div>
                          <div className="text-xs text-gray-500">Wednesday, 2:00 AM</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">158</div>
                        <div className="text-xs text-gray-500">12%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-100 rounded mr-3 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-600 rounded"></div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Slowest day</div>
                          <div className="text-xs text-gray-500">Friday, 6:00 AM</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">16</div>
                        <div className="text-xs text-gray-500">1.4%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview Stats */}
                <div className="bg-white rounded-xl border p-6">
                  <div className="space-y-4">
                    {/* Overquota interviews */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Overquota interviews</div>
                      <div className="text-lg font-bold text-gray-900">43</div>
                    </div>

                    {/* Disqualified interviews */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Disqualified interviews</div>
                      <div className="text-lg font-bold text-gray-900">365</div>
                    </div>

                    {/* Complete interviews */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Complete interviews</div>
                      <div className="text-lg font-bold text-gray-900">1297</div>
                    </div>

                    {/* Weekly distribution chart */}
                    <div className="mt-6">
                      <div className="h-20 bg-gradient-to-t from-blue-100 to-blue-200 rounded relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-full h-full" viewBox="0 0 200 60">
                            <path
                              d="M20,30 Q50,20 80,25 Q110,35 140,30 Q170,20 180,25"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              fill="none"
                            />
                            <path
                              d="M20,35 Q50,30 80,40 Q110,45 140,35 Q170,25 180,30"
                              stroke="#8b5cf6"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Week labels */}
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                      </div>

                      {/* Distribution info */}
                      <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                          <span>Distribution of users</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-800 rounded-full mr-1"></div>
                          <span>Users ID</span>
                        </div>
                        <span className="font-medium">16</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Screen Section */}
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2.0.- Welcome screen</h3>
              <p className="text-sm text-gray-600 mb-6">
                Title of the screener section
              </p>
              <p className="text-sm text-gray-600 mb-8">
                Write a few questions, designed to weed out the folks who aren't your intended audience and capture the ones who are.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Responses shown card */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">Responses shown</p>
                      <div className="text-3xl font-bold mb-2">1251</div>
                      <p className="text-purple-100 text-sm">Closed collection</p>
                    </div>
                    <div className="relative">
                      {/* Circular progress indicator */}
                      <div className="w-20 h-20 relative">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                          {/* Background circle */}
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="6"
                            fill="none"
                          />
                          {/* Progress circle */}
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="white"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${89 * 2.2} ${(100 - 89) * 2.2}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold">89%</span>
                          <span className="text-xs">Valid</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total participants card */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Total participants</p>
                      <div className="text-3xl font-bold mb-2">1297</div>
                      <p className="text-blue-100 text-sm">Closed collection</p>
                    </div>
                    <div className="relative">
                      {/* Circular progress indicator */}
                      <div className="w-20 h-20 relative">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                          {/* Background circle */}
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="6"
                            fill="none"
                          />
                          {/* Progress circle - full circle for 100% */}
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="white"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray="220 0"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold">100%</span>
                          <span className="text-xs">Valid</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters sidebar */}
        <div className="w-80 shrink-0 mt-[52px]">
          <Filters researchId={researchId} />
        </div>
      </div>
    </div>
  );
};