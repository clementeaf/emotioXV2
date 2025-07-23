import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { LocationConsentModal } from './components/common/LocationConsentModal';
import LoginRedirect from './components/common/LoginRedirect';
import TestLayoutMain from './components/TestLayout/TestLayoutMain';
import { useEyeTrackingConfigQuery } from './hooks/useEyeTrackingConfigQuery';
import { useLocationTracking } from './hooks/useLocationTracking';
import './index.css';
import NoResearchIdError from './pages/NoResearchIdError';

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
  const [researchId, setResearchId] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Obtener researchId de la URL o localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlResearchId = urlParams.get('researchId');
    const storedResearchId = localStorage.getItem('researchId');

    if (urlResearchId) {
      setResearchId(urlResearchId);
      localStorage.setItem('researchId', urlResearchId);
    } else if (storedResearchId) {
      setResearchId(storedResearchId);
    }
  }, []);

  // Obtener configuración de eye-tracking
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');

  // Determinar si el tracking de ubicación está habilitado
  const trackLocationEnabled = eyeTrackingConfig?.linkConfig?.trackLocation || false;

  // Hook de tracking de ubicación
  const {
    location,
    isLoading: isLoadingLocation,
    error: locationError,
    hasConsent,
    hasRequested,
    requestLocation,
    rejectLocation,
    clearLocation
  } = useLocationTracking({
    researchId,
    trackLocationEnabled
  });

  // Mostrar modal de consentimiento si es necesario
  useEffect(() => {
    if (researchId && trackLocationEnabled && !hasRequested && !isLoadingLocation) {
      setShowLocationModal(true);
    }
  }, [researchId, trackLocationEnabled, hasRequested, isLoadingLocation]);

  // Manejar aceptación de ubicación
  const handleAcceptLocation = async () => {
    setShowLocationModal(false);
    await requestLocation();
  };

  // Manejar rechazo de ubicación
  const handleRejectLocation = () => {
    setShowLocationModal(false);
    rejectLocation();
  };

  // Cerrar modal
  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
  };

  // Log para debugging
  useEffect(() => {
    console.log('[App] Estado de tracking de ubicación:', {
      researchId,
      trackLocationEnabled,
      hasConsent,
      hasRequested,
      location: location ? `${location.latitude}, ${location.longitude}` : null,
      error: locationError
    });
  }, [researchId, trackLocationEnabled, hasConsent, hasRequested, location, locationError]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          {/* Modal de consentimiento de ubicación */}
          <LocationConsentModal
            isOpen={showLocationModal}
            onAccept={handleAcceptLocation}
            onReject={handleRejectLocation}
            onClose={handleCloseLocationModal}
            researchTitle={eyeTrackingConfig?.researchId ? `la investigación ${eyeTrackingConfig.researchId}` : 'esta investigación'}
          />

          {/* Indicador de carga de ubicación */}
          {isLoadingLocation && (
            <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="text-sm">Obteniendo ubicación...</span>
              </div>
            </div>
          )}

          {/* Indicador de error de ubicación */}
          {locationError && (
            <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm">Error: {locationError}</span>
              </div>
            </div>
          )}

          {/* Indicador de ubicación obtenida */}
          {location && hasConsent && (
            <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">
                  Ubicación: {location.source === 'gps' ? 'GPS' : 'IP'}
                </span>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<LoginRedirect />} />
            <Route path="/error-no-research-id" element={<NoResearchIdError />} />
            <Route path="/test" element={<TestLayoutMain />} />
          </Routes>
        </div>
      </Router>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

export default App;
