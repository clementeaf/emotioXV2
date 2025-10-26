import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LoginRedirect from './components/common/LoginRedirect';
import TestLayoutMain from './components/TestLayout/components/TestLayoutMain';
import { useParticipantInfo } from './hooks/useParticipantInfo';
import { useTestStore } from './stores/useTestStore';
import './index.css';
import NoResearchIdError from './pages/NoResearchIdError';
import { PrivacyNoticePage } from './pages';

// Crear el cliente de Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  const { researchId, setParticipant } = useTestStore();

  useEffect(() => {
    const initializeStoreFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlResearchId = urlParams.get('researchId');

      if (urlResearchId && urlResearchId !== researchId) {
        setParticipant(
          '',
          '',
          '',
          urlResearchId
        );
      }
    };

    // 🎯 EJECUTAR INICIALIZACIÓN INMEDIATAMENTE
    initializeStoreFromURL();
  }, [researchId, setParticipant]);

  // 🎯 SIMPLIFICADO: Solo tracking básico si es necesario
  const { participantInfo, isLoading: isLoadingLocation, error: locationError } = useParticipantInfo({
    researchId: researchId || '',
    trackLocation: false, // Deshabilitado por defecto
    trackDevice: true,    // Solo información básica del dispositivo
    trackResponseTimes: false,
    trackNavigation: false
  });


  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">

          <Routes>
            <Route path="/" element={<LoginRedirect />} />
            <Route path="/error-no-research-id" element={<NoResearchIdError />} />
            <Route path="/test" element={<TestLayoutMain />} />
            <Route path="/privacy" element={<PrivacyNoticePage />} />
            <Route path="/:researchId/:participantId" element={<LoginRedirect />} />
          </Routes>
        </div>
      </Router>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

export default App;
