'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SmartVOCTextAnalysisProps {
  className?: string;
}

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

interface TopicData {
  name: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface CommentData {
  id: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  date: string;
  topics: string[];
}

export function SmartVOCTextAnalysis({ className }: SmartVOCTextAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'topics' | 'wordcloud' | 'comments'>('topics');
  const [timePeriod, setTimePeriod] = useState<'7days' | '30days' | '90days' | 'year'>('30days');
  
  // Datos simulados para el análisis de texto
  const [sentiment] = useState<SentimentData>({
    positive: 62,
    neutral: 25,
    negative: 13
  });
  
  const [topics] = useState<TopicData[]>([
    { name: 'Interface design', count: 342, sentiment: 'positive' },
    { name: 'Customer support', count: 287, sentiment: 'negative' },
    { name: 'App performance', count: 264, sentiment: 'neutral' },
    { name: 'Feature requests', count: 213, sentiment: 'positive' },
    { name: 'Billing issues', count: 198, sentiment: 'negative' },
    { name: 'Documentation', count: 176, sentiment: 'neutral' },
    { name: 'Onboarding process', count: 154, sentiment: 'positive' },
    { name: 'Bug reports', count: 142, sentiment: 'negative' }
  ]);
  
  const [comments] = useState<CommentData[]>([
    {
      id: '1',
      text: 'The new interface is much cleaner and more intuitive than before. I really appreciate the attention to detail.',
      sentiment: 'positive',
      date: '2023-05-12',
      topics: ['Interface design', 'Feature requests']
    },
    {
      id: '2',
      text: 'Customer support was unresponsive when I needed help with billing issues. Had to contact multiple times.',
      sentiment: 'negative',
      date: '2023-05-10',
      topics: ['Customer support', 'Billing issues']
    },
    {
      id: '3',
      text: 'App performance is acceptable but could be faster on mobile devices.',
      sentiment: 'neutral',
      date: '2023-05-08',
      topics: ['App performance']
    }
  ]);
  
  // Palabras para la nube de palabras con tamaños relativos
  const wordCloudData = [
    { text: 'Interface', size: 70 },
    { text: 'Support', size: 65 },
    { text: 'Responsive', size: 60 },
    { text: 'Design', size: 55 },
    { text: 'Features', size: 50 },
    { text: 'Performance', size: 48 },
    { text: 'Mobile', size: 45 },
    { text: 'Usability', size: 43 },
    { text: 'Billing', size: 40 },
    { text: 'Speed', size: 38 },
    { text: 'Navigation', size: 35 },
    { text: 'Customer', size: 33 },
    { text: 'Bugs', size: 30 },
    { text: 'Documentation', size: 28 },
    { text: 'Integration', size: 25 },
    { text: 'Experience', size: 23 },
    { text: 'Issues', size: 20 }
  ];
  
  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'neutral':
        return 'text-gray-500';
      case 'negative':
        return 'text-red-600';
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'topics':
        return (
          <div className="mt-6">
            <div className="flex mb-6">
              <div className="w-1/3 p-4 bg-white rounded-lg border border-neutral-200 shadow-sm">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Sentiment Distribution</h3>
                <div className="relative pt-1">
                  <div className="flex h-4 overflow-hidden rounded text-xs">
                    <div 
                      className="bg-green-500 flex flex-col justify-center text-center text-white" 
                      style={{ width: `${sentiment.positive}%` }}
                    ></div>
                    <div 
                      className="bg-gray-400 flex flex-col justify-center text-center text-white" 
                      style={{ width: `${sentiment.neutral}%` }}
                    ></div>
                    <div 
                      className="bg-red-500 flex flex-col justify-center text-center text-white" 
                      style={{ width: `${sentiment.negative}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-neutral-500">
                    <div>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Positive ({sentiment.positive}%)
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                      Neutral ({sentiment.neutral}%)
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                      Negative ({sentiment.negative}%)
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-2/3 ml-6 p-4 bg-white rounded-lg border border-neutral-200 shadow-sm">
                <h3 className="text-sm font-medium text-neutral-700 mb-4">Top Topics Mentioned</h3>
                <div className="grid grid-cols-2 gap-4">
                  {topics.slice(0, 6).map((topic, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className={cn("text-sm font-medium", getSentimentColor(topic.sentiment))}>
                          {topic.name}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {topic.count} mentions
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5">
              <h3 className="text-sm font-medium text-neutral-700 mb-4">All Topics</h3>
              <div className="overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Topic
                      </th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Mentions
                      </th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Sentiment
                      </th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {topics.map((topic, i) => (
                      <tr key={i}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {topic.name}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {topic.count}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={cn("text-sm", getSentimentColor(topic.sentiment))}>
                            {topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <svg 
                              className={cn(
                                "w-4 h-4", 
                                topic.sentiment === 'positive' ? "text-green-500" : 
                                topic.sentiment === 'negative' ? "text-red-500" : "text-gray-400"
                              )} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              {topic.sentiment === 'positive' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              ) : topic.sentiment === 'negative' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                              )}
                            </svg>
                            <span className="ml-1 text-xs text-neutral-500">
                              {topic.sentiment === 'positive' ? '+12%' : 
                               topic.sentiment === 'negative' ? '-8%' : '0%'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      case 'wordcloud':
        return (
          <div className="mt-6">
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
              <h3 className="text-sm font-medium text-neutral-700 mb-4">Word Cloud</h3>
              <div className="h-96 w-full relative">
                {wordCloudData.map((word, index) => (
                  <div 
                    key={index}
                    className="absolute text-neutral-800"
                    style={{
                      fontSize: `${word.size / 10}rem`,
                      left: `${Math.random() * 80}%`,
                      top: `${Math.random() * 80}%`,
                      transform: `rotate(${Math.random() * 30 - 15}deg)`,
                      opacity: 0.7 + (word.size / 100) * 0.3
                    }}
                  >
                    {word.text}
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-neutral-500 mt-4">
                Words sized by frequency in open-ended responses
              </div>
            </div>
          </div>
        );
      
      case 'comments':
        return (
          <div className="mt-6">
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5">
              <h3 className="text-sm font-medium text-neutral-700 mb-4">Recent Comments</h3>
              <div className="space-y-5">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-neutral-200 pb-4">
                    <div className="flex justify-between mb-2">
                      <div className={cn("text-sm font-medium", getSentimentColor(comment.sentiment))}>
                        {comment.sentiment.charAt(0).toUpperCase() + comment.sentiment.slice(1)} Comment
                      </div>
                      <div className="text-xs text-neutral-500">
                        {comment.date}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700 mb-2">
                      "{comment.text}"
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {comment.topics.map((topic, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" className="text-sm">
                  Load More Comments
                </Button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn("mt-10", className)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          Text Analysis for Open-ended Questions
        </h2>
        
        <div className="flex space-x-2">
          <Button
            variant={timePeriod === '7days' ? "default" : "outline"}
            className="text-xs h-8 px-3"
            onClick={() => setTimePeriod('7days')}
          >
            Last 7 days
          </Button>
          <Button
            variant={timePeriod === '30days' ? "default" : "outline"}
            className="text-xs h-8 px-3"
            onClick={() => setTimePeriod('30days')}
          >
            Last 30 days
          </Button>
          <Button
            variant={timePeriod === '90days' ? "default" : "outline"}
            className="text-xs h-8 px-3"
            onClick={() => setTimePeriod('90days')}
          >
            Last 90 days
          </Button>
          <Button
            variant={timePeriod === 'year' ? "default" : "outline"}
            className="text-xs h-8 px-3"
            onClick={() => setTimePeriod('year')}
          >
            Last year
          </Button>
        </div>
      </div>
      
      <div className="bg-neutral-50 rounded-lg p-1 flex space-x-1 mb-4">
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === 'topics' 
              ? "bg-white shadow-sm text-neutral-900" 
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          )}
          onClick={() => setActiveTab('topics')}
        >
          Key Topics
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === 'wordcloud' 
              ? "bg-white shadow-sm text-neutral-900" 
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          )}
          onClick={() => setActiveTab('wordcloud')}
        >
          Word Cloud
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === 'comments' 
              ? "bg-white shadow-sm text-neutral-900" 
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          )}
          onClick={() => setActiveTab('comments')}
        >
          Individual Comments
        </button>
      </div>
      
      {renderTabContent()}
    </div>
  );
} 