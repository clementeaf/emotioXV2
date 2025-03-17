'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

export default function EmotionsPage() {
  const emotionData = [
    { emotion: 'Joy', value: 75, color: 'bg-yellow-500' },
    { emotion: 'Trust', value: 85, color: 'bg-green-500' },
    { emotion: 'Fear', value: 45, color: 'bg-red-500' },
    { emotion: 'Surprise', value: 60, color: 'bg-purple-500' },
    { emotion: 'Sadness', value: 30, color: 'bg-blue-500' },
    { emotion: 'Disgust', value: 25, color: 'bg-emerald-500' },
    { emotion: 'Anger', value: 40, color: 'bg-orange-500' },
    { emotion: 'Anticipation', value: 70, color: 'bg-cyan-500' },
  ];

  const recentAnalysis = [
    {
      id: 1,
      title: 'Product A Campaign',
      date: '2024-02-15',
      dominantEmotion: 'Joy',
      score: 8.5,
    },
    {
      id: 2,
      title: 'Service B Feedback',
      date: '2024-02-14',
      dominantEmotion: 'Trust',
      score: 7.8,
    },
    {
      id: 3,
      title: 'Brand Perception Study',
      date: '2024-02-13',
      dominantEmotion: 'Anticipation',
      score: 8.2,
    },
  ];

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-neutral-900">Emotion Analysis</h1>
              <p className="mt-2 text-sm text-neutral-600">
                Track and analyze emotional responses across your research projects
              </p>
            </div>

            {/* Emotion Distribution */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Emotion Distribution</h3>
                <div className="space-y-4">
                  {emotionData.map((item) => (
                    <div key={item.emotion} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 w-24">{item.emotion}</span>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-neutral-600 w-12 text-right">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Recent Analysis</h3>
                <div className="space-y-6">
                  {recentAnalysis.map((analysis) => (
                    <div key={analysis.id} className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900">{analysis.title}</h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatDate(analysis.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-neutral-900">{analysis.dominantEmotion}</p>
                        <p className="text-xs text-neutral-500 mt-1">Score: {analysis.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Emotion Insights */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Key Insights</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Positive emotions dominate recent studies</p>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Joy increased by 15% in the last month</p>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Trust remains the strongest emotion</p>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Recommendations</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Focus on trust-building elements</p>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Address negative emotions in UI/UX</p>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Enhance positive emotional triggers</p>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Next Steps</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Schedule detailed emotion analysis</p>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Review negative emotion triggers</p>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mt-1.5 mr-2"></span>
                    <p className="text-sm text-neutral-600">Plan follow-up research studies</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 