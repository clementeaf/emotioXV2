'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SmartVOCSentimentAnalysisProps {
  className?: string;
}

interface Comment {
  id: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  displayColor: string;
}

interface ThemeData {
  id: string;
  name: string;
  count: number;
  percentage: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface KeywordData {
  id: string;
  word: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export function SmartVOCSentimentAnalysis({ className }: SmartVOCSentimentAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'sentiment' | 'themes' | 'keywords'>('sentiment');
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  
  // Datos simulados de comentarios
  const [comments] = useState<Comment[]>([
    { 
      id: '1', 
      text: 'Camera lens working memory in different scenarios',
      sentiment: 'positive',
      displayColor: 'green'
    },
    { 
      id: '2', 
      text: 'Laptop: Camera lens memory increased',
      sentiment: 'positive',
      displayColor: 'green'
    },
    { 
      id: '3', 
      text: 'Mobile',
      sentiment: 'positive',
      displayColor: 'green'
    },
    { 
      id: '4', 
      text: 'Camera lens',
      sentiment: 'positive',
      displayColor: 'green'
    },
    { 
      id: '5', 
      text: 'Computer accessories',
      sentiment: 'positive',
      displayColor: 'green'
    },
    { 
      id: '6', 
      text: 'TV, Camera lens working memory improvement',
      sentiment: 'positive',
      displayColor: 'green'
    },
    { 
      id: '7', 
      text: 'Mobile, lens working memory in action',
      sentiment: 'positive',
      displayColor: 'green'
    },
    { 
      id: '8', 
      text: 'Laptop',
      sentiment: 'neutral',
      displayColor: 'green'
    },
    { 
      id: '9', 
      text: 'Camera lens working memory analysis',
      sentiment: 'neutral',
      displayColor: 'green'
    },
    { 
      id: '10', 
      text: 'Camera lens working memory test',
      sentiment: 'neutral',
      displayColor: 'green'
    },
  ]);
  
  // Datos simulados para temas identificados
  const [themes] = useState<ThemeData[]>([
    { id: '1', name: 'Working memory', count: 156, percentage: 34, sentiment: 'positive' },
    { id: '2', name: 'Camera lens', count: 123, percentage: 27, sentiment: 'positive' },
    { id: '3', name: 'Education', count: 87, percentage: 19, sentiment: 'positive' },
    { id: '4', name: 'Cognitive development', count: 68, percentage: 15, sentiment: 'neutral' },
    { id: '5', name: 'Research directions', count: 45, percentage: 10, sentiment: 'neutral' },
    { id: '6', name: 'Learning process', count: 42, percentage: 9, sentiment: 'positive' },
    { id: '7', name: 'Memory improvement', count: 38, percentage: 8, sentiment: 'positive' },
    { id: '8', name: 'Educational practice', count: 31, percentage: 7, sentiment: 'neutral' },
  ]);
  
  // Datos simulados para palabras clave
  const [keywords] = useState<KeywordData[]>([
    { id: '1', word: 'memory', count: 213, sentiment: 'positive' },
    { id: '2', word: 'working', count: 187, sentiment: 'positive' },
    { id: '3', word: 'camera', count: 145, sentiment: 'positive' },
    { id: '4', word: 'lens', count: 132, sentiment: 'positive' },
    { id: '5', word: 'cognitive', count: 98, sentiment: 'neutral' },
    { id: '6', word: 'education', count: 95, sentiment: 'positive' },
    { id: '7', word: 'development', count: 78, sentiment: 'neutral' },
    { id: '8', word: 'improvement', count: 67, sentiment: 'positive' },
    { id: '9', word: 'research', count: 54, sentiment: 'neutral' },
    { id: '10', word: 'practice', count: 42, sentiment: 'neutral' },
  ]);
  
  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-neutral-100 text-neutral-800';
    }
  };
  
  const renderSentimentContent = () => {
    return (
      <div className="mt-6">
        <h3 className="text-base font-medium mb-4">Análisis de sentimiento</h3>
        
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <p className="text-neutral-800 leading-relaxed">
            Then I explore the nature of cognitive developmental improvements in working memory, 
            the role of working memory in learning, and some potential implications of working 
            memory and its development for the education of children and adults.
          </p>
          
          <p className="text-neutral-800 leading-relaxed mt-4">
            The use of working memory is quite ubiquitous in human thought, but the best way to improve 
            education using what we know about working memory is still controversial. I hope to provide some 
            directions for research and educational practice.
          </p>
          
          <div className="mt-6">
            <h4 className="font-medium text-neutral-700 mb-2">Accionables:</h4>
            <ul className="space-y-2">
              <li className="text-neutral-700">
                Using what we know about working memory is still controversial.
              </li>
              <li className="text-neutral-700">
                I hope to provide some directions for research and educational practice.
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  const renderThemesContent = () => {
    return (
      <div className="mt-6">
        <h3 className="text-base font-medium mb-4">Temas identificados</h3>
        
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Tema
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Menciones
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Porcentaje
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Sentimiento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {themes.map((theme) => (
                  <tr key={theme.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {theme.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {theme.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {theme.percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getSentimentColor(theme.sentiment))}>
                        {theme.sentiment === 'positive' ? 'Positivo' : theme.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  const renderKeywordsContent = () => {
    return (
      <div className="mt-6">
        <h3 className="text-base font-medium mb-4">Palabras clave</h3>
        
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex flex-wrap gap-3">
            {keywords.map((keyword) => (
              <div 
                key={keyword.id} 
                className="relative"
                style={{ 
                  fontSize: `${Math.max(0.8, Math.min(2, 0.8 + (keyword.count / 100)))}rem`,
                }}
              >
                <span className={cn(
                  "inline-block px-3 py-1 rounded-full",
                  keyword.sentiment === 'positive' ? 'bg-green-100 text-green-800' : 
                  keyword.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 
                  'bg-neutral-100 text-neutral-800'
                )}>
                  {keyword.word}
                  <span className="ml-1 text-xs opacity-70">({keyword.count})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={cn("mt-6 mb-10", className)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          2.6.- Pregunta: Voice of Customer (VOC)
        </h2>
        
        <div className="flex items-center space-x-3 text-xs">
          <span className="px-2 py-1 bg-green-50 text-green-600 rounded">
            Short Text question
          </span>
          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">
            Conditionality disabled
          </span>
          <span className="px-2 py-1 bg-red-50 text-red-600 rounded">
            Required
          </span>
          <button className="text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-6">
        {/* Lista de comentarios - 3 columnas */}
        <div className="col-span-3 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="font-medium text-neutral-700">Comentarios</h3>
            <span className="text-xs text-neutral-500">Mood</span>
          </div>
          
          <div className="divide-y divide-neutral-200 max-h-[500px] overflow-y-auto">
            {comments.map((comment) => (
              <div 
                key={comment.id} 
                className={cn(
                  "p-4 flex items-start space-x-3 cursor-pointer hover:bg-neutral-50",
                  selectedComment === comment.id && "bg-neutral-50"
                )}
                onClick={() => setSelectedComment(comment.id)}
              >
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 mt-1" 
                  checked={selectedComment === comment.id}
                  onChange={() => setSelectedComment(selectedComment === comment.id ? null : comment.id)}
                />
                <div className="flex-1">
                  <p className="text-sm text-neutral-900">{comment.text}</p>
                </div>
                <div className="text-xs font-medium" style={{ color: comment.displayColor }}>
                  {comment.sentiment === 'positive' ? 'Positive' : 
                   comment.sentiment === 'negative' ? 'Negative' : 'Neutral'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Panel de análisis - 4 columnas */}
        <div className="col-span-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="border-b border-neutral-200">
            <nav className="flex -mb-px">
              <button 
                className={cn(
                  "py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 whitespace-nowrap",
                  activeTab === 'sentiment' 
                    ? "text-blue-600 border-blue-600" 
                    : "text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300"
                )}
                onClick={() => setActiveTab('sentiment')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                Sentiment
              </button>
              
              <button 
                className={cn(
                  "py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 whitespace-nowrap",
                  activeTab === 'themes' 
                    ? "text-blue-600 border-blue-600" 
                    : "text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300"
                )}
                onClick={() => setActiveTab('themes')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Themes
              </button>
              
              <button 
                className={cn(
                  "py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 whitespace-nowrap",
                  activeTab === 'keywords' 
                    ? "text-blue-600 border-blue-600" 
                    : "text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300"
                )}
                onClick={() => setActiveTab('keywords')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Keywords
              </button>
            </nav>
          </div>
          
          <div className="p-4">
            {activeTab === 'sentiment' && renderSentimentContent()}
            {activeTab === 'themes' && renderThemesContent()}
            {activeTab === 'keywords' && renderKeywordsContent()}
          </div>
        </div>
      </div>
    </div>
  );
} 