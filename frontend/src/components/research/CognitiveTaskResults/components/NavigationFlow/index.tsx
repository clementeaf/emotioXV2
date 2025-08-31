/**
 * NavigationFlow component - Simple implementation
 */

import React from 'react';
import type { NavigationFlowResultsProps } from './types';

const NavigationFlowResults: React.FC<NavigationFlowResultsProps> = ({ 
  researchId, 
  data 
}) => {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Navigation Flow Results</h3>
      <p className="text-sm text-gray-600">Research ID: {researchId}</p>
      
      {data ? (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {data.metrics.totalClicks}
              </div>
              <div className="text-sm text-blue-500">Total Clicks</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">
                {data.metrics.averageTimeOnPage}s
              </div>
              <div className="text-sm text-green-500">Avg. Time</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-2xl font-bold text-red-600">
                {data.metrics.bounceRate}%
              </div>
              <div className="text-sm text-red-500">Bounce Rate</div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Heatmap areas: {data.heatmapAreas.length} | 
            Click events: {data.clickData.length}
          </div>
        </div>
      ) : (
        <div className="mt-4 text-gray-500">
          No navigation flow data available
        </div>
      )}
    </div>
  );
};

export default NavigationFlowResults;