import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dynamicHeight, setDynamicHeight] = useState<number | 'auto'>('auto');
  const [isAdjusting, setIsAdjusting] = useState(false);

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
      initialVisibleItems: 5, // Mostrar más items inicialmente
      items: demographicsData?.countries || [
        { id: 'country-1', label: 'Estonia' },
        { id: 'country-2', label: 'Chile' },
        { id: 'country-3', label: 'Mexico' }
      ]
    },
    {
      title: 'Age range',
      initialVisibleItems: 5,
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
      initialVisibleItems: 5,
      items: demographicsData?.educationLevels || [
        { id: 'edu-1', label: 'High school graduate', count: 8 },
        { id: 'edu-2', label: 'Some college', count: 3 },
        { id: 'edu-3', label: 'College graduate', count: 6 }
      ]
    },
    {
      title: 'User ID',
      initialVisibleItems: 10, // Mostrar más User IDs inicialmente
      items: demographicsData?.userIds || [
        { id: 'user-1', label: 'e5adfa14-18be-433e-e5d4-ce8' },
        { id: 'user-2', label: 'eytd414-12he-123e-e52h4-ck85' },
        { id: 'user-3', label: 'y9dhcr89-11xk-643s-g7s9-ch73' }
      ]
    },
    {
      title: 'Participants',
      initialVisibleItems: 10,
      items: demographicsData?.participants || [
        { id: 'part-1', label: '11 mar 2024, Chile' },
        { id: 'part-2', label: '11 mar 2024, Chile' },
        { id: 'part-3', label: '11 mar 2024, Chile' }
      ]
    }
  ];

  // Mostrar resumen de datos si hay muchos participantes
  const totalParticipants = demographicsData?.participants?.reduce((sum, item) => sum + item.count, 0) || 0;
  const showDataSummary = totalParticipants > 10;

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

  // Función para calcular la altura dinámica
  const calculateDynamicHeight = () => {
    if (containerRef.current) {
      setIsAdjusting(true);

      const container = containerRef.current;
      const contentHeight = container.scrollHeight;

      // Solo altura mínima, sin límite máximo para evitar scrollbar
      const minHeight = 400; // Altura mínima en píxeles
      let calculatedHeight = Math.max(minHeight, contentHeight);

      // Agregar un pequeño padding para evitar que el contenido toque los bordes
      calculatedHeight += 20;

      setDynamicHeight(calculatedHeight);

      // Quitar el indicador de ajuste después de un breve delay
      setTimeout(() => {
        setIsAdjusting(false);
      }, 300);
    }
  };

  // Efecto para recalcular altura cuando cambian las secciones expandidas
  useEffect(() => {
    // Pequeño delay para permitir que el DOM se actualice
    const timer = setTimeout(() => {
      calculateDynamicHeight();
    }, 100);

    return () => clearTimeout(timer);
  }, [expandedSections, showMoreSections, demographicsData]);

  // Efecto para recalcular altura cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      calculateDynamicHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <Card
      className={`p-4 ${className} ${isAdjusting ? 'ring-2 ring-blue-200' : ''}`}
      style={{
        height: typeof dynamicHeight === 'number' ? `${dynamicHeight}px` : dynamicHeight,
        overflowY: 'hidden', // Nunca mostrar scrollbar
        transition: 'height 0.3s ease-in-out'
      }}
    >
      <div ref={containerRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {isAdjusting && (
            <div className="flex items-center text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-1"></div>
              Ajustando
            </div>
          )}
        </div>

        {/* Data summary for large datasets */}
        {showDataSummary && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="text-sm text-green-800">
              <div className="font-medium">📊 Resumen de Datos</div>
              <div>Total de participantes: {totalParticipants}</div>
              <div>Países: {demographicsData?.countries?.length || 0}</div>
              <div>Rangos de edad: {demographicsData?.ageRanges?.length || 0}</div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mr-2"></div>
              <span className="text-sm text-gray-600">Cargando filtros...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="text-sm text-red-800">
              <div>Error al cargar filtros</div>
              <div className="text-xs">{error}</div>
            </div>
          </div>
        )}



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
      </div>
    </Card>
  );
}
