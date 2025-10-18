import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../components/commons';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const AllTheProviders = ({ 
  children, 
  queryClient = createTestQueryClient(),
  withRouter = true,
  withErrorBoundary = true 
}: {
  children: React.ReactNode;
  queryClient?: QueryClient;
  withRouter?: boolean;
  withErrorBoundary?: boolean;
}) => {
  let content = children;

  if (withErrorBoundary) {
    content = <ErrorBoundary>{content}</ErrorBoundary>;
  }

  if (withRouter) {
    content = <BrowserRouter>{content}</BrowserRouter>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {content}
    </QueryClientProvider>
  );
};
