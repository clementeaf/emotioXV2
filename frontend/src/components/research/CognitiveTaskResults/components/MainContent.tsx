'use client';

import React, { useState } from 'react';
import { AnalysisTabType, CommentsList, AnalysisTabs, SentimentAnalysisPanel, ThemesPanel, KeywordsPanel } from './';
import { CognitiveTaskQuestion } from '../types';

interface MainContentProps {
  data: CognitiveTaskQuestion;
}

export function MainContent({ data }: MainContentProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTabType>('sentiment');
  const [selectedItems, setSelectedItems] = useState<string[]>(['5']); // Iniciar con "Camera lens" seleccionado

  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (data.sentimentResults) {
      if (selectedItems.length === data.sentimentResults.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(data.sentimentResults.map(item => item.id));
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
      {/* Panel izquierdo: Lista de comentarios */}
      {data.sentimentResults && (
        <CommentsList
          comments={data.sentimentResults}
          selectedItems={selectedItems}
          onToggleSelection={toggleItemSelection}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Panel derecho: Análisis de sentimiento */}
      <div className="max-h-[500px] overflow-y-auto">
        {/* Pestañas */}
        <AnalysisTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Contenido de la pestaña */}
        {activeTab === 'sentiment' && (
          <SentimentAnalysisPanel analysis={data.sentimentAnalysis} />
        )}

        {activeTab === 'themes' && (
          <ThemesPanel themes={data.themes} />
        )}

        {activeTab === 'keywords' && (
          <KeywordsPanel keywords={data.keywords} />
        )}
      </div>
    </div>
  );
} 