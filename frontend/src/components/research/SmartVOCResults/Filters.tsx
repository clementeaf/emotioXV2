import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useDemographicsData } from '@/hooks/useDemographicsData';

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
  researchId: string;
}

export function Filters({ className, researchId }: FiltersProps) {
  const { data: demographicsData, isLoading, error } = useDemographicsData(researchId);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Country': true,
    'Age range': true,
    'Gender': true,
    'Education level': true,
    'User ID': true,
    'Participants': true,
  });

  const [showMoreSections, setShowMoreSections] = useState<Record<string, boolean>>({});

  // Generar secciones de filtros basadas en datos reales
  const filterSections: FilterSection[] = [
    {
      title: 'Country',
      initialVisibleItems: 3,
      items: demographicsData?.countries || [
        { id: 'country-1', label: 'Estonia' },
        { id: 'country-2', label: 'Chile' },
        { id: 'country-3', label: 'Mexico' }
      ]
    },
    {
      title: 'Age range',
      initialVisibleItems: 3,
      items: demographicsData?.ageRanges || [
        { id: 'age-1', label: '< 19', count: 1 },
        { id: 'age-2', label: '30-34', count: 4 },
        { id: 'age-3', label: '35-39', count: 8 }
      ]
    },
    {
      title: 'Gender',
      items: demographicsData?.genders || [
        { id: 'gender-1', label: 'Male', count: 24 },
        { id: 'gender-2', label: 'Female', count: 23 }
      ]
    },
    {
      title: 'Education level',
      initialVisibleItems: 3,
      items: demographicsData?.educationLevels || [
        { id: 'edu-1', label: 'High school graduate', count: 8 },
        { id: 'edu-2', label: 'Some college', count: 3 },
        { id: 'edu-3', label: 'College graduate', count: 6 }
      ]
    },
    {
      title: 'User ID',
      initialVisibleItems: 3,
      items: demographicsData?.userIds || [
        { id: 'user-1', label: 'e5adfa14-18be-433e-e5d4-ce8' },
        { id: 'user-2', label: 'eytd414-12he-123e-e52h4-ck85' },
        { id: 'user-3', label: 'y9dhcr89-11xk-643s-g7s9-ch73' }
      ]
    },
    {
      title: 'Participants',
      initialVisibleItems: 3,
      items: demographicsData?.participants || [
        { id: 'part-1', label: '11 mar 2024, Chile' },
        { id: 'part-2', label: '11 mar 2024, Chile' },
        { id: 'part-3', label: '11 mar 2024, Chile' }
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

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-500">Cargando filtros...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500">Error al cargar filtros: {error}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

      {/* Notification box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-800">
            <div>New data was obtained</div>
            <div>Please, update study</div>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Update
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filterSections.map((section) => {
          const isExpanded = expandedSections[section.title];
          const showMore = showMoreSections[section.title];
          const visibleItems = showMore
            ? section.items
            : section.items.slice(0, section.initialVisibleItems || section.items.length);

          return (
            <div key={section.title} className="border-b border-gray-200 pb-4 last:border-b-0">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-2"
              >
                {section.title}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-2">
                  {visibleItems.map((item) => (
                    <div key={item.id} className="flex items-center">
                      <Checkbox id={item.id} />
                      <label htmlFor={item.id} className="ml-2 text-sm text-gray-700">
                        {item.label}
                        {item.count !== undefined && (
                          <span className="text-gray-500 ml-1">({item.count})</span>
                        )}
                      </label>
                    </div>
                  ))}

                  {section.items.length > (section.initialVisibleItems || section.items.length) && (
                    <button
                      onClick={() => toggleShowMore(section.title)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showMore ? 'Show less' : `Show ${section.items.length - (section.initialVisibleItems || section.items.length)} more`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
