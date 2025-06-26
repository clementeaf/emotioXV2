import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import { Checkbox } from './ui/Checkbox';

interface FilterSection {
  title: string;
  items: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  initialVisibleItems?: number;
}

interface FiltersProps {
  className?: string;
}

export function Filters({ className }: FiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Country': true,
    'Age range': true,
    'Gender': true,
    'Education level': true,
    'User ID': true,
    'Participants': true,
  });

  const [showMoreSections, setShowMoreSections] = useState<Record<string, boolean>>({});

  const filterSections: FilterSection[] = [
    {
      title: 'Country',
      initialVisibleItems: 3,
      items: [
        { id: 'country-1', label: 'Estonia' },
        { id: 'country-2', label: 'Chile' },
        { id: 'country-3', label: 'Mexico' },
        { id: 'country-4', label: 'Spain' }
      ]
    },
    {
      title: 'Age range',
      initialVisibleItems: 3,
      items: [
        { id: 'age-1', label: '< 19', count: 1 },
        { id: 'age-2', label: '30-34', count: 4 },
        { id: 'age-3', label: '35-39', count: 8 },
        { id: 'age-4', label: '40-44', count: 23 }
      ]
    },
    {
      title: 'Gender',
      items: [
        { id: 'gender-1', label: 'Male', count: 24 },
        { id: 'gender-2', label: 'Female', count: 23 }
      ]
    },
    {
      title: 'Education level',
      initialVisibleItems: 3,
      items: [
        { id: 'edu-1', label: 'High school graduate', count: 8 },
        { id: 'edu-2', label: 'Some college', count: 3 },
        { id: 'edu-3', label: 'College graduate', count: 6 },
        { id: 'edu-4', label: 'Some postgraduate work', count: 2 },
        { id: 'edu-5', label: 'Post graduate degree', count: 12 }
      ]
    },
    {
      title: 'User ID',
      initialVisibleItems: 3,
      items: [
        { id: 'user-1', label: 'e5adfa14-18be-433e-e5d4-ce8' },
        { id: 'user-2', label: 'eytd414-12he-123e-e52h4-ck85' },
        { id: 'user-3', label: 'y9dhcr89-11xk-643s-g7s9-ch73' },
        { id: 'user-4', label: 'gtdo874-11ae-193b-f65h1-cl851' }
      ]
    },
    {
      title: 'Participants',
      initialVisibleItems: 3,
      items: [
        { id: 'part-1', label: '11 mar 2024, Chile' },
        { id: 'part-2', label: '11 mar 2024, Chile' },
        { id: 'part-3', label: '11 mar 2024, Chile' },
        { id: 'part-4', label: '11 mar 2024, Chile' }
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const toggleShowMore = (title: string) => {
    setShowMoreSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <Card className="max-h-[920px] flex flex-col">
      <div className="p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm">New data was obtained</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm">Please, update study</p>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
              Update
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          {filterSections.map((section) => (
            <div key={section.title}>
              <div 
                className="flex justify-between items-center cursor-pointer mb-2"
                onClick={() => toggleSection(section.title)}
              >
                <h3 className="font-medium text-sm">{section.title}</h3>
                {expandedSections[section.title] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              
              {expandedSections[section.title] && (
                <div className="space-y-1.5">
                  {section.items
                    .slice(0, showMoreSections[section.title] ? undefined : section.initialVisibleItems)
                    .map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox id={item.id} />
                        <label htmlFor={item.id} className="text-sm flex-1 truncate">
                          {item.label}
                        </label>
                        {item.count !== undefined && (
                          <span className="text-xs text-gray-500 flex-shrink-0">({item.count})</span>
                        )}
                      </div>
                    ))}
                  
                  {section.initialVisibleItems && section.items.length > section.initialVisibleItems && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleShowMore(section.title);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 