import { ReactNode } from 'react';

import { ErrorLogProvider } from '@/components/utils/ErrorLogger';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ResearchProvider } from '@/providers/ResearchProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <AuthProvider>
      <QueryProvider>
        <ResearchProvider>
          <ErrorLogProvider>
            {children}
          </ErrorLogProvider>
        </ResearchProvider>
      </QueryProvider>
    </AuthProvider>
  );
};
