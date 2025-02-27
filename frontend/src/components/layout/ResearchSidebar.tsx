'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ResearchSidebarProps {
  researchId: string;
  activeStage: string;
  className?: string;
}

interface Section {
  id: string;
  title: string;
  stages?: {
    id: string;
    title: string;
  }[];
}

const sections: Section[] = [
  {
    id: 'build',
    title: 'Build',
    stages: [
      { id: 'welcome', title: 'Welcome Screen' },
      { id: 'smart-voc', title: 'Smart VOC' },
      { id: 'cognitive', title: 'Cognitive Tasks' },
      { id: 'eye-tracking', title: 'Eye Tracking' },
      { id: 'thank-you', title: 'Thank You Screen' }
    ]
  },
  {
    id: 'recruit',
    title: 'Recruit',
    stages: [
      { id: 'configuration', title: 'Configuration' },
      { id: 'participants', title: 'Participants' }
    ]
  },
  {
    id: 'results',
    title: 'Results',
    stages: [
      { id: 'overview', title: 'Overview' },
      { id: 'analytics', title: 'Analytics' },
      { id: 'export', title: 'Export' }
    ]
  }
];

export function ResearchSidebar({ researchId, activeStage, className }: ResearchSidebarProps) {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'build';

  return (
    <div className={cn("w-64 bg-white border-r border-neutral-200 flex flex-col", className)}>
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-6 px-3">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <div className="px-3">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>

              {section.stages?.map((stage) => (
                <Link
                  key={stage.id}
                  href={`/research/${researchId}?section=${section.id}&stage=${stage.id}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    currentSection === section.id && activeStage === stage.id
                      ? "bg-neutral-100 text-neutral-900 font-medium"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  )}
                >
                  <span className="flex-1">{stage.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
} 