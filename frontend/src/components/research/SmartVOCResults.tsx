'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SmartVOCResultsProps {
  className?: string;
}

interface QuestionData {
  id: string;
  title: string;
  questionText: string;
  type: 'Linear Scale' | 'Multiple Choice' | 'Open Text';
  conditionalityDisabled: boolean;
  required: boolean;
  responseCount: number;
  score: number;
  categories: {
    name: string;
    percentage: number;
    color: string;
  }[];
  sentimentAnalysis?: SentimentAnalysisData;
  themeAnalysis?: ThemeAnalysisData[];
  keywordAnalysis?: KeywordData[];
  timeSeriesData?: TimeSeriesPoint[];
}

interface SentimentAnalysisData {
  positive: number;
  neutral: number;
  negative: number;
  topPositiveKeywords: string[];
  topNegativeKeywords: string[];
}

interface ThemeAnalysisData {
  theme: string;
  percentage: number;
  sentiment: number;
  keywords: string[];
}

interface KeywordData {
  keyword: string;
  count: number;
  sentiment: number;
}

interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface ScatterPlotPoint {
  x: number;
  y: number;
  cluster: number;
}

export function SmartVOCResults({ className }: SmartVOCResultsProps) {
  const [filterCountries, setFilterCountries] = useState<string[]>(['Chile', 'Mexico']);
  const [filterAgeRanges, setFilterAgeRanges] = useState<string[]>(['30-34', '35-39']);
  const [filterGenders, setFilterGenders] = useState<string[]>(['Male', 'Femle']);
  const [filterEducation, setFilterEducation] = useState<string[]>([]);
  const [showMoreCountries, setShowMoreCountries] = useState(false);
  const [showMoreAges, setShowMoreAges] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'themes' | 'keywords'>('overview');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  
  const [questions] = useState<QuestionData[]>([
    {
      id: 'csat',
      title: 'Customer Satisfaction Score (CSAT)',
      questionText: 'How would you rate your overall satisfaction level with [company]?',
      type: 'Linear Scale',
      conditionalityDisabled: true,
      required: true,
      responseCount: 28635,
      score: 53,
      categories: [
        { name: 'Promoters', percentage: 70, color: 'bg-green-500' },
        { name: 'Neutrals', percentage: 10, color: 'bg-gray-400' },
        { name: 'Detractors', percentage: 20, color: 'bg-red-500' }
      ],
      sentimentAnalysis: {
        positive: 65,
        neutral: 20,
        negative: 15,
        topPositiveKeywords: ['helpful', 'easy', 'friendly', 'fast', 'reliable'],
        topNegativeKeywords: ['slow', 'difficult', 'confusing', 'expensive', 'unresponsive']
      },
      themeAnalysis: [
        { theme: 'Customer Service', percentage: 35, sentiment: 72, keywords: ['help', 'support', 'response'] },
        { theme: 'Product Quality', percentage: 28, sentiment: 68, keywords: ['quality', 'reliable', 'durable'] },
        { theme: 'Ease of Use', percentage: 22, sentiment: 82, keywords: ['easy', 'intuitive', 'simple'] },
        { theme: 'Value for Money', percentage: 15, sentiment: 45, keywords: ['price', 'cost', 'expensive'] }
      ],
      keywordAnalysis: [
        { keyword: 'support', count: 254, sentiment: 70 },
        { keyword: 'quality', count: 187, sentiment: 81 },
        { keyword: 'price', count: 129, sentiment: 35 },
        { keyword: 'interface', count: 112, sentiment: 76 },
        { keyword: 'reliability', count: 98, sentiment: 65 }
      ],
      timeSeriesData: [
        { date: '2023-01', value: 48 },
        { date: '2023-02', value: 51 },
        { date: '2023-03', value: 49 },
        { date: '2023-04', value: 53 },
        { date: '2023-05', value: 58 },
        { date: '2023-06', value: 55 }
      ]
    },
    {
      id: 'ces',
      title: 'Customer Effort Score (CES)',
      questionText: 'It was easy for me to handle my issue today',
      type: 'Linear Scale',
      conditionalityDisabled: true,
      required: true,
      responseCount: 24625,
      score: 45,
      categories: [
        { name: 'Little effort', percentage: 70, color: 'bg-green-500' },
        { name: 'Neutrals', percentage: 10, color: 'bg-gray-400' },
        { name: 'Much effort', percentage: 20, color: 'bg-red-500' }
      ],
      sentimentAnalysis: {
        positive: 42,
        neutral: 30,
        negative: 28,
        topPositiveKeywords: ['simple', 'quick', 'efficient', 'convenient', 'straightforward'],
        topNegativeKeywords: ['complicated', 'frustrating', 'lengthy', 'time-consuming', 'difficult']
      },
      themeAnalysis: [
        { theme: 'Process Complexity', percentage: 40, sentiment: 42, keywords: ['steps', 'complex', 'process'] },
        { theme: 'Time Spent', percentage: 32, sentiment: 38, keywords: ['time', 'wait', 'long'] },
        { theme: 'User Interface', percentage: 18, sentiment: 60, keywords: ['interface', 'platform', 'navigation'] },
        { theme: 'Support Experience', percentage: 10, sentiment: 55, keywords: ['support', 'assistance', 'help'] }
      ],
      keywordAnalysis: [
        { keyword: 'process', count: 312, sentiment: 42 },
        { keyword: 'time', count: 287, sentiment: 35 },
        { keyword: 'support', count: 198, sentiment: 55 },
        { keyword: 'steps', count: 154, sentiment: 40 },
        { keyword: 'interface', count: 92, sentiment: 60 }
      ],
      timeSeriesData: [
        { date: '2023-01', value: 42 },
        { date: '2023-02', value: 40 },
        { date: '2023-03', value: 43 },
        { date: '2023-04', value: 45 },
        { date: '2023-05', value: 47 },
        { date: '2023-06', value: 45 }
      ]
    },
    {
      id: 'nps',
      title: 'Net Promoter Score (NPS)',
      questionText: 'How likely are you to recommend [company] to a friend or colleague?',
      type: 'Linear Scale',
      conditionalityDisabled: false,
      required: true,
      responseCount: 32458,
      score: 64,
      categories: [
        { name: 'Promoters', percentage: 75, color: 'bg-green-500' },
        { name: 'Neutrals', percentage: 14, color: 'bg-gray-400' },
        { name: 'Detractors', percentage: 11, color: 'bg-red-500' }
      ],
      sentimentAnalysis: {
        positive: 72,
        neutral: 18,
        negative: 10,
        topPositiveKeywords: ['recommend', 'great', 'excellent', 'best', 'valuable'],
        topNegativeKeywords: ['wouldn\'t recommend', 'disappointing', 'overpriced', 'lacking', 'poor']
      },
      themeAnalysis: [
        { theme: 'Brand Reputation', percentage: 45, sentiment: 75, keywords: ['brand', 'reputation', 'trusted'] },
        { theme: 'Product Quality', percentage: 30, sentiment: 70, keywords: ['quality', 'reliable', 'durable'] },
        { theme: 'Value Proposition', percentage: 15, sentiment: 62, keywords: ['value', 'worth', 'investment'] },
        { theme: 'Competitive Comparison', percentage: 10, sentiment: 68, keywords: ['competitor', 'alternative', 'comparison'] }
      ],
      keywordAnalysis: [
        { keyword: 'recommend', count: 425, sentiment: 80 },
        { keyword: 'quality', count: 312, sentiment: 75 },
        { keyword: 'brand', count: 205, sentiment: 72 },
        { keyword: 'service', count: 182, sentiment: 68 },
        { keyword: 'price', count: 145, sentiment: 55 }
      ],
      timeSeriesData: [
        { date: '2023-01', value: 60 },
        { date: '2023-02', value: 62 },
        { date: '2023-03', value: 63 },
        { date: '2023-04', value: 65 },
        { date: '2023-05', value: 64 },
        { date: '2023-06', value: 64 }
      ]
    },
    {
      id: 'user-experience',
      title: 'User Experience Rating',
      questionText: 'Rate your experience using our application today',
      type: 'Linear Scale',
      conditionalityDisabled: false,
      required: true,
      responseCount: 21536,
      score: 71,
      categories: [
        { name: 'Excellent', percentage: 72, color: 'bg-green-500' },
        { name: 'Average', percentage: 18, color: 'bg-gray-400' },
        { name: 'Poor', percentage: 10, color: 'bg-red-500' }
      ],
      sentimentAnalysis: {
        positive: 78,
        neutral: 12,
        negative: 10,
        topPositiveKeywords: ['intuitive', 'clean', 'modern', 'fast', 'responsive'],
        topNegativeKeywords: ['confusing', 'cluttered', 'slow', 'buggy', 'outdated']
      },
      themeAnalysis: [
        { theme: 'UI Design', percentage: 42, sentiment: 82, keywords: ['design', 'interface', 'layout'] },
        { theme: 'Performance', percentage: 28, sentiment: 75, keywords: ['speed', 'fast', 'response'] },
        { theme: 'Navigation', percentage: 18, sentiment: 68, keywords: ['menu', 'find', 'navigation'] },
        { theme: 'Mobile Experience', percentage: 12, sentiment: 72, keywords: ['mobile', 'app', 'phone'] }
      ],
      keywordAnalysis: [
        { keyword: 'design', count: 345, sentiment: 85 },
        { keyword: 'speed', count: 278, sentiment: 75 },
        { keyword: 'navigation', count: 225, sentiment: 68 },
        { keyword: 'responsive', count: 182, sentiment: 82 },
        { keyword: 'modern', count: 168, sentiment: 90 }
      ],
      timeSeriesData: [
        { date: '2023-01', value: 65 },
        { date: '2023-02', value: 67 },
        { date: '2023-03', value: 68 },
        { date: '2023-04', value: 70 },
        { date: '2023-05', value: 72 },
        { date: '2023-06', value: 71 }
      ]
    },
    {
      id: 'feature-satisfaction',
      title: 'Feature Satisfaction',
      questionText: 'How satisfied are you with our new features?',
      type: 'Linear Scale',
      conditionalityDisabled: false,
      required: true,
      responseCount: 18943,
      score: 68,
      categories: [
        { name: 'Satisfied', percentage: 68, color: 'bg-green-500' },
        { name: 'Neutral', percentage: 22, color: 'bg-gray-400' },
        { name: 'Dissatisfied', percentage: 10, color: 'bg-red-500' }
      ],
      sentimentAnalysis: {
        positive: 70,
        neutral: 20,
        negative: 10,
        topPositiveKeywords: ['useful', 'helpful', 'innovative', 'productive', 'convenient'],
        topNegativeKeywords: ['unnecessary', 'complicated', 'missing', 'basic', 'limited']
      },
      themeAnalysis: [
        { theme: 'Productivity Features', percentage: 38, sentiment: 75, keywords: ['productivity', 'workflow', 'efficiency'] },
        { theme: 'Integration Capabilities', percentage: 25, sentiment: 65, keywords: ['integration', 'connect', 'sync'] },
        { theme: 'Customization Options', percentage: 22, sentiment: 72, keywords: ['customize', 'personalize', 'settings'] },
        { theme: 'New Feature Adoption', percentage: 15, sentiment: 60, keywords: ['learning', 'adoption', 'new'] }
      ],
      keywordAnalysis: [
        { keyword: 'productivity', count: 285, sentiment: 78 },
        { keyword: 'integration', count: 230, sentiment: 65 },
        { keyword: 'customization', count: 198, sentiment: 75 },
        { keyword: 'workflow', count: 175, sentiment: 80 },
        { keyword: 'learning', count: 142, sentiment: 58 }
      ],
      timeSeriesData: [
        { date: '2023-01', value: 62 },
        { date: '2023-02', value: 64 },
        { date: '2023-03', value: 65 },
        { date: '2023-04', value: 67 },
        { date: '2023-05', value: 68 },
        { date: '2023-06', value: 68 }
      ]
    },
    {
      id: 'problem-resolution',
      title: 'Problem Resolution Time',
      questionText: 'My issue was resolved in a timely manner',
      type: 'Linear Scale',
      conditionalityDisabled: true,
      required: true,
      responseCount: 22351,
      score: 58,
      categories: [
        { name: 'Quickly resolved', percentage: 62, color: 'bg-green-500' },
        { name: 'Average time', percentage: 15, color: 'bg-gray-400' },
        { name: 'Too slow', percentage: 23, color: 'bg-red-500' }
      ],
      sentimentAnalysis: {
        positive: 60,
        neutral: 15,
        negative: 25,
        topPositiveKeywords: ['quick', 'efficient', 'immediate', 'prompt', 'fast'],
        topNegativeKeywords: ['slow', 'delay', 'wait', 'long', 'frustrating']
      },
      themeAnalysis: [
        { theme: 'Response Time', percentage: 42, sentiment: 58, keywords: ['response', 'wait', 'time'] },
        { theme: 'Support Quality', percentage: 30, sentiment: 68, keywords: ['support', 'staff', 'expertise'] },
        { theme: 'Issue Complexity', percentage: 18, sentiment: 52, keywords: ['complex', 'difficult', 'technical'] },
        { theme: 'Follow-up Process', percentage: 10, sentiment: 62, keywords: ['follow', 'update', 'status'] }
      ],
      keywordAnalysis: [
        { keyword: 'time', count: 380, sentiment: 55 },
        { keyword: 'support', count: 310, sentiment: 68 },
        { keyword: 'wait', count: 248, sentiment: 40 },
        { keyword: 'response', count: 215, sentiment: 60 },
        { keyword: 'resolved', count: 190, sentiment: 65 }
      ],
      timeSeriesData: [
        { date: '2023-01', value: 55 },
        { date: '2023-02', value: 56 },
        { date: '2023-03', value: 57 },
        { date: '2023-04', value: 58 },
        { date: '2023-05', value: 58 },
        { date: '2023-06', value: 58 }
      ]
    }
  ]);

  const toggleFilterCountry = (country: string) => {
    if (filterCountries.includes(country)) {
      setFilterCountries(filterCountries.filter(c => c !== country));
    } else {
      setFilterCountries([...filterCountries, country]);
    }
  };

  const toggleFilterAge = (age: string) => {
    if (filterAgeRanges.includes(age)) {
      setFilterAgeRanges(filterAgeRanges.filter(a => a !== age));
    } else {
      setFilterAgeRanges([...filterAgeRanges, age]);
    }
  };

  const toggleFilterGender = (gender: string) => {
    if (filterGenders.includes(gender)) {
      setFilterGenders(filterGenders.filter(g => g !== gender));
    } else {
      setFilterGenders([...filterGenders, gender]);
    }
  };

  const toggleFilterEducation = (education: string) => {
    if (filterEducation.includes(education)) {
      setFilterEducation(filterEducation.filter(e => e !== education));
    } else {
      setFilterEducation([...filterEducation, education]);
    }
  };

  const handleTabChange = (tab: 'overview' | 'sentiment' | 'themes' | 'keywords') => {
    setActiveTab(tab);
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestion(questionId);
    setShowAdvancedAnalysis(true);
  };

  const renderTabs = () => {
    return (
      <div className="mb-6 border-b border-neutral-200">
        <nav className="flex -mb-px">
          <button 
            className={cn(
              'py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 whitespace-nowrap',
              activeTab === 'overview' 
                ? 'text-blue-600 border-blue-600' 
                : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300'
            )}
            onClick={() => handleTabChange('overview')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Overview
          </button>
          
          <button 
            className={cn(
              'py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 whitespace-nowrap',
              activeTab === 'sentiment' 
                ? 'text-blue-600 border-blue-600' 
                : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300'
            )}
            onClick={() => handleTabChange('sentiment')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Sentiment
          </button>
          
          <button 
            className={cn(
              'py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 whitespace-nowrap',
              activeTab === 'themes' 
                ? 'text-blue-600 border-blue-600' 
                : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300'
            )}
            onClick={() => handleTabChange('themes')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Themes
          </button>
          
          <button 
            className={cn(
              'py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 whitespace-nowrap',
              activeTab === 'keywords' 
                ? 'text-blue-600 border-blue-600' 
                : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300'
            )}
            onClick={() => handleTabChange('keywords')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Keywords
          </button>
        </nav>
      </div>
    );
  };

  // Función para mostrar análisis avanzado basado en la pestaña seleccionada
  const renderAdvancedAnalysis = () => {
    if (!selectedQuestion) return null;
    
    const question = questions.find(q => q.id === selectedQuestion);
    if (!question) return null;
    
    switch (activeTab) {
      case 'overview':
        return renderOverviewAnalysis(question);
      case 'sentiment':
        return renderSentimentAnalysis(question);
      case 'themes':
        return renderThemeAnalysis(question);
      case 'keywords':
        return renderKeywordAnalysis(question);
      default:
        return null;
    }
  };
  
  // Vista general del análisis (vista resumida)
  const renderOverviewAnalysis = (question: QuestionData) => {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{question.title}</h2>
          <button 
            className="text-neutral-500 hover:text-neutral-800"
            onClick={() => setShowAdvancedAnalysis(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Resumen de estadísticas */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Question Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-neutral-500">Total Responses</div>
                <div className="text-2xl font-semibold">{question.responseCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Score</div>
                <div className="text-2xl font-semibold">{question.score}/100</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Positive Sentiment</div>
                <div className="text-2xl font-semibold text-green-600">{question.sentimentAnalysis?.positive || 0}%</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Negative Sentiment</div>
                <div className="text-2xl font-semibold text-red-600">{question.sentimentAnalysis?.negative || 0}%</div>
              </div>
            </div>
          </div>
          
          {/* Gráfico temporal */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Score Trend</h3>
            <div className="h-48 flex items-end justify-between">
              {question.timeSeriesData?.map((point, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-8 bg-blue-500 rounded-t"
                    style={{ height: `${point.value}%` }}
                  ></div>
                  <div className="text-xs mt-2 text-neutral-600">{point.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Distribución de categorías */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Category Distribution</h3>
            {question.categories.map((category, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{category.name}</span>
                  <span>{category.percentage}%</span>
                </div>
                <div className="w-full h-4 bg-neutral-100 rounded-full">
                  <div 
                    className={`h-full rounded-full ${category.color}`} 
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Temas principales */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Top Themes</h3>
            {question.themeAnalysis?.map((theme, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{theme.theme}</span>
                  <div className="flex items-center">
                    <span className={theme.sentiment > 50 ? 'text-green-600' : 'text-red-600'}>
                      {theme.sentiment}%
                    </span>
                    <span className="text-neutral-500 mx-2">|</span>
                    <span>{theme.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-4 bg-neutral-100 rounded-full">
                  <div 
                    className={theme.sentiment > 70 ? 'bg-green-500' : theme.sentiment > 40 ? 'bg-blue-500' : 'bg-red-500'}
                    style={{ width: `${theme.percentage}%`, height: '100%', borderRadius: '0.25rem' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Análisis de sentimiento detallado
  const renderSentimentAnalysis = (question: QuestionData) => {
    const sentimentData = question.sentimentAnalysis;
    if (!sentimentData) return <div>No sentiment data available</div>;
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Sentiment Analysis: {question.title}</h2>
          <button 
            className="text-neutral-500 hover:text-neutral-800"
            onClick={() => setShowAdvancedAnalysis(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-8 mb-8">
          {/* Distribución de sentimiento */}
          <div className="col-span-2 bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Sentiment Distribution</h3>
            <div className="flex h-10 mb-4 rounded-md overflow-hidden">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${sentimentData.positive}%` }}
              ></div>
              <div 
                className="bg-gray-400 h-full" 
                style={{ width: `${sentimentData.neutral}%` }}
              ></div>
              <div 
                className="bg-red-500 h-full" 
                style={{ width: `${sentimentData.negative}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <span className="inline-block w-3 h-3 bg-green-500 mr-1 rounded-sm"></span>
                <span className="font-medium">Positive:</span> {sentimentData.positive}%
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-gray-400 mr-1 rounded-sm"></span>
                <span className="font-medium">Neutral:</span> {sentimentData.neutral}%
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-red-500 mr-1 rounded-sm"></span>
                <span className="font-medium">Negative:</span> {sentimentData.negative}%
              </div>
            </div>
          </div>
          
          {/* Indicador de sentimiento general */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5 flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium mb-4">Overall Sentiment</h3>
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={sentimentData.positive > 70 ? '#10B981' : sentimentData.positive > 40 ? '#3B82F6' : '#EF4444'}
                  strokeWidth="3"
                  strokeDasharray={`${sentimentData.positive}, 100`}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold">{sentimentData.positive}</div>
                <div className="text-sm text-neutral-500">positive</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Palabras clave positivas */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Top Positive Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {sentimentData.topPositiveKeywords.map((keyword, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          {/* Palabras clave negativas */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Top Negative Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {sentimentData.topNegativeKeywords.map((keyword, index) => (
                <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Análisis temático
  const renderThemeAnalysis = (question: QuestionData) => {
    const themeData = question.themeAnalysis;
    if (!themeData || themeData.length === 0) return <div>No theme data available</div>;
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Theme Analysis: {question.title}</h2>
          <button 
            className="text-neutral-500 hover:text-neutral-800"
            onClick={() => setShowAdvancedAnalysis(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {themeData.map((theme, index) => (
            <div key={index} className="bg-white rounded-lg border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">{theme.theme}</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-sm text-neutral-500 mr-2">Prevalence:</span>
                    <span className="font-semibold">{theme.percentage}%</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-neutral-500 mr-2">Sentiment:</span>
                    <span className={`font-semibold ${theme.sentiment > 70 ? 'text-green-600' : theme.sentiment > 40 ? 'text-blue-500' : 'text-red-600'}`}>
                      {theme.sentiment}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="w-full h-3 bg-neutral-100 rounded-full">
                  <div 
                    className={theme.sentiment > 70 ? 'bg-green-500' : theme.sentiment > 40 ? 'bg-blue-500' : 'bg-red-500'}
                    style={{ width: `${theme.percentage}%`, height: '100%', borderRadius: '0.25rem' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Related Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {theme.keywords.map((keyword, i) => (
                    <span key={i} className="px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Análisis de palabras clave
  const renderKeywordAnalysis = (question: QuestionData) => {
    const keywordData = question.keywordAnalysis;
    if (!keywordData || keywordData.length === 0) return <div>No keyword data available</div>;
    
    // Ordenar las palabras clave por conteo
    const sortedKeywords = [...keywordData].sort((a, b) => b.count - a.count);
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Keyword Analysis: {question.title}</h2>
          <button 
            className="text-neutral-500 hover:text-neutral-800"
            onClick={() => setShowAdvancedAnalysis(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Visualización de palabras clave */}
          <div className="col-span-2 bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Keyword Frequency</h3>
            <div className="grid grid-cols-2 gap-4">
              {sortedKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span 
                      className={`w-3 h-3 rounded-full mr-2 ${
                        keyword.sentiment > 70 ? 'bg-green-500' : 
                        keyword.sentiment > 40 ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span className="font-medium">{keyword.keyword}</span>
                  </div>
                  <span className="text-neutral-500">{keyword.count}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Distribución de sentimiento */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-lg font-medium mb-4">Sentiment Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Positive</span>
                  <span>{keywordData.filter(k => k.sentiment > 70).length}</span>
                </div>
                <div className="w-full h-4 bg-neutral-100 rounded-full">
                  <div 
                    className="bg-green-500 h-full rounded-full"
                    style={{ 
                      width: `${(keywordData.filter(k => k.sentiment > 70).length / keywordData.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Neutral</span>
                  <span>{keywordData.filter(k => k.sentiment >= 40 && k.sentiment <= 70).length}</span>
                </div>
                <div className="w-full h-4 bg-neutral-100 rounded-full">
                  <div 
                    className="bg-blue-500 h-full rounded-full"
                    style={{ 
                      width: `${(keywordData.filter(k => k.sentiment >= 40 && k.sentiment <= 70).length / keywordData.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Negative</span>
                  <span>{keywordData.filter(k => k.sentiment < 40).length}</span>
                </div>
                <div className="w-full h-4 bg-neutral-100 rounded-full">
                  <div 
                    className="bg-red-500 h-full rounded-full"
                    style={{ 
                      width: `${(keywordData.filter(k => k.sentiment < 40).length / keywordData.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 py-6 px-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-4">
          1.0 - Smart VOC
        </h1>
        
        {showAdvancedAnalysis ? (
          <>
            {renderTabs()}
            {renderAdvancedAnalysis()}
          </>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="mb-10 border-b border-neutral-200 pb-10">
              <div className="flex items-center mb-4">
                <div className="flex-1">
                  <h2 className="text-neutral-900 font-medium">
                    {index + 1}.{index % 2 + 1} - Question: {question.title}
                  </h2>
                </div>
                
                <div className="flex items-center space-x-3 text-xs">
                  <span className="px-2 py-1 bg-green-50 text-green-600 rounded">
                    Linear Scale question
                  </span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    Conditionality disabled
                  </span>
                  <span className="px-2 py-1 bg-red-50 text-red-600 rounded">
                    Required
                  </span>
                  <button 
                    className="text-neutral-400 hover:text-blue-500"
                    onClick={() => handleQuestionSelect(question.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-8">
                <div className="flex-1">
                  {question.categories.map((category, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span>{category.name}</span>
                        <span>{category.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full">
                        <div 
                          className={`h-full rounded-full ${category.color}`} 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                        ?
                      </div>
                      <h3 className="font-medium">{question.id.toUpperCase()}'s question</h3>
                    </div>
                    <p className="text-neutral-600 text-sm ml-8">
                      {question.questionText}
                    </p>
                  </div>
                </div>
                
                <div className="w-40">
                  <div className="mb-3">
                    <div className="text-sm text-neutral-500">Responses</div>
                    <div className="flex items-baseline">
                      <div className="text-2xl font-semibold">{(question.responseCount / 1000).toFixed(1)}k</div>
                      <div className="text-xs text-neutral-400 ml-1">26s</div>
                    </div>
                  </div>
                  
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="3"
                        strokeDasharray="100, 100"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeDasharray={`${question.score}, 100`}
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold">
                      {question.score}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Sidebar filters */}
      <div className="w-72 bg-white border-l border-neutral-200 p-6">
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Filters</h2>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm">New data was obtained</span>
              <Button className="bg-blue-600 text-white px-3 py-1 text-xs h-auto">Update</Button>
            </div>
            <p className="text-xs text-neutral-600">Please, update study</p>
          </div>
          
          {/* Countries filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Country</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="country-estonia" 
                  className="rounded border-neutral-300"
                  checked={filterCountries.includes('Estonia')}
                  onChange={() => toggleFilterCountry('Estonia')}
                />
                <label htmlFor="country-estonia" className="ml-2 text-sm">Estonia</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="country-chile" 
                  className="rounded border-neutral-300"
                  checked={filterCountries.includes('Chile')}
                  onChange={() => toggleFilterCountry('Chile')}
                />
                <label htmlFor="country-chile" className="ml-2 text-sm">Chile</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="country-mexico" 
                  className="rounded border-neutral-300"
                  checked={filterCountries.includes('Mexico')}
                  onChange={() => toggleFilterCountry('Mexico')}
                />
                <label htmlFor="country-mexico" className="ml-2 text-sm">Mexico</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="country-spain" 
                  className="rounded border-neutral-300"
                  checked={filterCountries.includes('Spain')}
                  onChange={() => toggleFilterCountry('Spain')}
                />
                <label htmlFor="country-spain" className="ml-2 text-sm">Spain</label>
              </div>
              
              <button 
                className="text-sm text-neutral-500 flex items-center"
                onClick={() => setShowMoreCountries(!showMoreCountries)}
              >
                {showMoreCountries ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    Show less
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    Show more
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Age range filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Age range</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="age-19" 
                  className="rounded border-neutral-300"
                  checked={filterAgeRanges.includes('< 19')}
                  onChange={() => toggleFilterAge('< 19')}
                />
                <label htmlFor="age-19" className="ml-2 text-sm">{'< 19'} (1)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="age-30-34" 
                  className="rounded border-neutral-300"
                  checked={filterAgeRanges.includes('30-34')}
                  onChange={() => toggleFilterAge('30-34')}
                />
                <label htmlFor="age-30-34" className="ml-2 text-sm">30-34 (4)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="age-35-39" 
                  className="rounded border-neutral-300"
                  checked={filterAgeRanges.includes('35-39')}
                  onChange={() => toggleFilterAge('35-39')}
                />
                <label htmlFor="age-35-39" className="ml-2 text-sm">35-39 (8)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="age-40-44" 
                  className="rounded border-neutral-300"
                  checked={filterAgeRanges.includes('40-44')}
                  onChange={() => toggleFilterAge('40-44')}
                />
                <label htmlFor="age-40-44" className="ml-2 text-sm">40-44 (23)</label>
              </div>
              
              <button 
                className="text-sm text-neutral-500 flex items-center"
                onClick={() => setShowMoreAges(!showMoreAges)}
              >
                {showMoreAges ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    Show less
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    Show more
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Gender filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Gender</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="gender-male" 
                  className="rounded border-neutral-300"
                  checked={filterGenders.includes('Male')}
                  onChange={() => toggleFilterGender('Male')}
                />
                <label htmlFor="gender-male" className="ml-2 text-sm">Male (24)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="gender-female" 
                  className="rounded border-neutral-300"
                  checked={filterGenders.includes('Femle')}
                  onChange={() => toggleFilterGender('Femle')}
                />
                <label htmlFor="gender-female" className="ml-2 text-sm">Femle (23)</label>
              </div>
            </div>
          </div>
          
          {/* Education level filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Education level</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edu-high-school" 
                  className="rounded border-neutral-300"
                  checked={filterEducation.includes('High school graduate')}
                  onChange={() => toggleFilterEducation('High school graduate')}
                />
                <label htmlFor="edu-high-school" className="ml-2 text-sm">High school graduate (8)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edu-some-college" 
                  className="rounded border-neutral-300"
                  checked={filterEducation.includes('Some college')}
                  onChange={() => toggleFilterEducation('Some college')}
                />
                <label htmlFor="edu-some-college" className="ml-2 text-sm">Some college (3)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edu-college-grad" 
                  className="rounded border-neutral-300"
                  checked={filterEducation.includes('College graduate')}
                  onChange={() => toggleFilterEducation('College graduate')}
                />
                <label htmlFor="edu-college-grad" className="ml-2 text-sm">College graduate (6)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edu-some-postgrad" 
                  className="rounded border-neutral-300"
                  checked={filterEducation.includes('Some postgraduate work')}
                  onChange={() => toggleFilterEducation('Some postgraduate work')}
                />
                <label htmlFor="edu-some-postgrad" className="ml-2 text-sm">Some postgraduate work (2)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edu-postgrad" 
                  className="rounded border-neutral-300"
                  checked={filterEducation.includes('Post graduate degree')}
                  onChange={() => toggleFilterEducation('Post graduate degree')}
                />
                <label htmlFor="edu-postgrad" className="ml-2 text-sm">Post graduate degree (12)</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 