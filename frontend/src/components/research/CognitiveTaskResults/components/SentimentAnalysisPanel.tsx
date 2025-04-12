'use client';

import React from 'react';
import { SentimentAnalysis } from '../types';

interface SentimentAnalysisPanelProps {
  analysis?: SentimentAnalysis;
}

export function SentimentAnalysisPanel({ analysis }: SentimentAnalysisPanelProps) {
  if (!analysis) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-500">No hay datos de análisis disponibles.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Sentiment analysis</h3>
      
      <div className="text-neutral-700 mb-6 whitespace-pre-line">
        {analysis.text}
      </div>
      
      {analysis.actionables && analysis.actionables.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-neutral-800 mb-3">Accionables:</h4>
          <ul className="space-y-2">
            {analysis.actionables.map((item, index) => (
              <li key={index} className="text-neutral-700">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 