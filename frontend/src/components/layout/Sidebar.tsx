'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  activeResearch?: {
    id: string;
    name: string;
  };
}

const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'new-research', label: 'New Research', href: '/dashboard/research/new' },
  { id: 'research-history', label: "Research's History", href: '/research-history' },
  { id: 'research', label: 'Research', href: '/research' },
  { id: 'emotions', label: 'Emotions', href: '/emotions' },
];

const researchStages = [
  {
    id: 'build',
    label: 'Build',
    isCompleted: false,
    isEnabled: true,
    subsections: [
      { id: 'welcome', label: 'Welcome Screen', isCompleted: false, isEnabled: true },
      { id: 'smart-voc', label: 'Smart VOC', isCompleted: false, isEnabled: true },
      { id: 'cognitive', label: 'Cognitive Tasks', isCompleted: false, isEnabled: true },
      { id: 'eye-tracking', label: 'Eye Tracking', isCompleted: false, isEnabled: true },
      { id: 'thank-you', label: 'Thank You Screen', isCompleted: false, isEnabled: true },
    ],
  },
  {
    id: 'recruit',
    label: 'Recruit',
    isCompleted: false,
    isEnabled: true,
    subsections: [
      { id: 'screener', label: 'Screener', isCompleted: false, isEnabled: true },
      { id: 'welcome-screen', label: 'Welcome screen', isCompleted: false, isEnabled: true },
      { id: 'implicit-association', label: 'Implicit Association', isCompleted: false, isEnabled: true },
      { id: 'cognitive-task', label: 'Cognitive task', isCompleted: false, isEnabled: true },
      { id: 'eye-tracking', label: 'Eye Tracking', isCompleted: false, isEnabled: true },
      { id: 'thank-you', label: 'Thank you screen', isCompleted: false, isEnabled: true },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    isCompleted: false,
    isEnabled: true,
    subsections: [
      { id: 'smartvoc', label: 'Smart VOC', isCompleted: false, isEnabled: true },
      { id: 'cognitive-task', label: 'Tareas Cognitivas', isCompleted: false, isEnabled: true },
    ],
  },
];

const researchTypes = [
  { id: 'eye-tracking', label: 'Eye Tracking', href: '/research-types/eye-tracking', count: 24 },
  { id: 'attention-prediction', label: 'Attention Prediction', href: '/research-types/attention-prediction', count: 16 },
  { id: 'cognitive-analysis', label: 'Cognitive Analysis', href: '/research-types/cognitive-analysis', count: 12 },
];

export function Sidebar({ className, activeResearch }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'build';
  const currentStage = searchParams.get('stage') || 'welcome';
  
  // Determinar si estamos en una página de investigación específica
  const isResearchPage = pathname.includes('/research/') && activeResearch?.id;

  return (
    <div className={cn("w-64 flex-shrink-0 border-r border-neutral-200 bg-white", className)}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto py-5">
          <div className="px-4 mb-8">
            <h1 className="text-xl font-semibold text-neutral-900">EmotioX</h1>
            {activeResearch && (
              <p className="mt-2 text-sm text-neutral-600">{activeResearch.name}</p>
            )}
          </div>

          <nav className="flex flex-1 flex-col px-4">
            {!isResearchPage ? (
              <>
                {/* Main Navigation - Solo mostrar en modo dashboard */}
                <div className="mb-8">
                  <h2 className="px-3 text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                    Main
                  </h2>
                  <ul className="space-y-1">
                    {mainNavItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-x-3 rounded-md px-3 py-2 text-sm transition-colors",
                            pathname === item.href
                              ? "bg-neutral-50 text-neutral-900 font-medium"
                              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Research Types - Solo mostrar en modo dashboard */}
                <div>
                  <h2 className="px-3 text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                    Research Types
                  </h2>
                  <ul className="space-y-1">
                    {researchTypes.map((type) => (
                      <li key={type.id}>
                        <Link
                          href={type.href}
                          className={cn(
                            "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                            pathname === type.href
                              ? "bg-neutral-50 text-neutral-900 font-medium"
                              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                          )}
                        >
                          <span>{type.label}</span>
                          <span className="text-xs text-neutral-500">{type.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div>
                {/* Navegación de investigación - mostrar cuando estamos en una página de investigación */}
                <ul className="flex flex-1 flex-col gap-y-7">
                  {researchStages.map((section) => (
                    <li key={section.id}>
                      <div className="mb-3">
                        <h3 className="px-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          {section.label}
                        </h3>
                      </div>
                      <ul className="space-y-1">
                        {section.subsections.map((subsection) => (
                          <li key={subsection.id}>
                            <Link
                              href={`/research/${activeResearch.id}?section=${section.id}&stage=${subsection.id}`}
                              className={cn(
                                "flex items-center gap-x-3 px-3 py-2 text-sm rounded-md transition-colors",
                                currentSection === section.id && currentStage === subsection.id
                                  ? "bg-neutral-50 text-neutral-900 font-medium"
                                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                                !subsection.isEnabled && "opacity-50 cursor-not-allowed pointer-events-none"
                              )}
                            >
                              <span className="flex-1">{subsection.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
} 