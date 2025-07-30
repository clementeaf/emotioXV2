'use client';

import { useState } from 'react';

import { CognitiveTaskQuestion } from '../types';

import { AnalysisTabs, AnalysisTabType, CommentsList, KeywordsPanel, SentimentAnalysisPanel, ThemesPanel } from './';

interface MainContentProps {
  data: CognitiveTaskQuestion;
  initialActiveTab?: AnalysisTabType;
  themeImageSrc?: string;
}

export function MainContent({
  data,
  initialActiveTab = 'sentiment',
  themeImageSrc
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTabType>(initialActiveTab);
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
          questionId={data.questionNumber}
          questionType={data.questionType}
          required={data.required}
          conditionalityDisabled={data.conditionalityDisabled}
        />
      )}

      {/* Debug: Mostrar si no hay sentimentResults */}
      {!data.sentimentResults && (
        <div className="p-4 text-center text-gray-500">
          <p>No hay datos de sentimiento disponibles</p>
          <p className="text-sm">data.sentimentResults: {JSON.stringify(data.sentimentResults)}</p>
        </div>
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
          <ThemesPanel
            themes={data.themes}
            imageSrc={themeImageSrc}
          />
        )}

        {activeTab === 'keywords' && (
          <KeywordsPanel keywords={data.keywords} />
        )}
      </div>
    </div>
  );
}
