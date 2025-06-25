import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSearchParams } from 'next/navigation';
import { DashboardShellProps } from '../../../../shared/interfaces/dashboard.interface';

/**
 * Shell del dashboard que maneja la estructura y sidebar
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section') || 'welcome-screen';

  const sidebar = researchId
    ? <ResearchSidebar researchId={researchId} activeStage={section} />
    : <Sidebar />;

  return (
    <AppShellLayout sidebar={sidebar}>
      {children}
    </AppShellLayout>
  );
}
