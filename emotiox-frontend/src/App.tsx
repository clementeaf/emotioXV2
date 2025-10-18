import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/commons';
import { queryClient } from './lib/query-client';
import { routes } from './config';
import { mapRoutesToElements, createRedirectRoute } from './utils';
import { useMemo } from 'react';

function App() {
  const routeElements = useMemo(() => mapRoutesToElements(routes), []);
  const redirectRoute = useMemo(() => createRedirectRoute('*', '/login'), []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {routeElements.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            <Route path={redirectRoute.path} element={redirectRoute.element} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App
