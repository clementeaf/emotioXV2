'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
];

const researchStages = [
  {
    id: 'build',
    label: 'Build',
    isCompleted: false,
    isEnabled: true,
    subsections: [
      { id: 'welcome', label: 'Welcome screen', isCompleted: false, isEnabled: true },
      { id: 'smart-voc', label: 'Smart VOC', isCompleted: false, isEnabled: false },
      { id: 'cognitive-task', label: 'Cognitive task', isCompleted: false, isEnabled: false },
      { id: 'thank-you', label: 'Thank you screen', isCompleted: false, isEnabled: false },
    ],
  },
  {
    id: 'recruit',
    label: 'Recruit',
    isCompleted: false,
    isEnabled: false,
    subsections: [
      { id: 'eye-tracking', label: 'Eye Tracking', isCompleted: false, isEnabled: false },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    isCompleted: false,
    isEnabled: false,
    subsections: [
      { id: 'overview', label: 'Overview', isCompleted: false, isEnabled: false },
      { id: 'responses', label: 'Responses', isCompleted: false, isEnabled: false },
      { id: 'analysis', label: 'Analysis', isCompleted: false, isEnabled: false },
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
            {!activeResearch ? (
              <>
                {/* Main Navigation */}
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

                {/* Research Types */}
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
                <ul className="flex flex-1 flex-col gap-y-7">
                  {researchStages.map((section) => (
                    <li key={section.id}>
                      <div className="mb-3">
                        <div className="flex items-center gap-x-3">
                          <div className={cn(
                            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border",
                            section.isCompleted 
                              ? "bg-blue-500 border-blue-500" 
                              : "border-neutral-300"
                          )}>
                            {section.isCompleted && (
                              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium text-neutral-900">
                            {section.label}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {section.subsections.map((subsection) => (
                          <li key={subsection.id}>
                            <Link
                              href={`/dashboard?research=${activeResearch.id}&section=${section.id}&stage=${subsection.id}`}
                              className={cn(
                                "block rounded-md transition-colors",
                                !subsection.isEnabled && "opacity-50 cursor-not-allowed pointer-events-none"
                              )}
                            >
                              <div className={cn(
                                "flex items-center gap-x-3 px-4 py-2",
                                pathname === `/dashboard?research=${activeResearch.id}&section=${section.id}&stage=${subsection.id}`
                                  ? "bg-neutral-50 text-neutral-900"
                                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                              )}>
                                <div className={cn(
                                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                                  subsection.isCompleted 
                                    ? "bg-blue-500 border-blue-500" 
                                    : "border-neutral-300 group-hover:border-neutral-400"
                                )}>
                                  {subsection.isCompleted && (
                                    <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <span className="flex-1 text-sm">{subsection.label}</span>
                              </div>
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