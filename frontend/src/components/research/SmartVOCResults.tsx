'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
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
}

export function SmartVOCResults({ className }: SmartVOCResultsProps) {
  const [filterCountries, setFilterCountries] = useState<string[]>(['Chile', 'Mexico']);
  const [filterAgeRanges, setFilterAgeRanges] = useState<string[]>(['30-34', '35-39']);
  const [filterGenders, setFilterGenders] = useState<string[]>(['Male', 'Femle']);
  const [filterEducation, setFilterEducation] = useState<string[]>([]);
  const [showMoreCountries, setShowMoreCountries] = useState(false);
  const [showMoreAges, setShowMoreAges] = useState(false);
  
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

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 py-6 px-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-4">
          1.0 - Smart VOC
        </h1>
        
        {questions.map((question, index) => (
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
                <button className="text-neutral-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
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
        ))}
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