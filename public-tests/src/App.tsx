import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';

import './index.css';

import PrivacyNoticePage from './pages/PrivacyNoticePage';

function LoginRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const researchId = params.get('researchId');

    if (researchId) {
      // Si hay researchId, ir directamente al flujo de participante
      navigate(`/link/${researchId}`);
    } else {
      // Si no hay researchId, mostrar mensaje de error
      navigate('/error-no-research-id');
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Redirigiendo...
        </h2>
        <p className="text-gray-600">
          Cargando la investigación...
        </p>
      </div>
    </div>
  );
}

function NoResearchIdError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          ⚠️ Acceso Inválido
        </h2>
        <p className="text-gray-600 mb-4">
          Para acceder a una investigación, necesitas un enlace válido con un ID de investigación.
        </p>
        <p className="text-sm text-gray-500">
          Ejemplo: <code className="bg-gray-100 px-2 py-1 rounded">?researchId=tu-id-aqui</code>
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<LoginRedirect />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/error-no-research-id" element={<NoResearchIdError />} />



        <Route path="/privacy" element={<PrivacyNoticePage />} />
        {/* Catch-all route for any unmatched paths including /index.html */}
        <Route path="*" element={<LoginRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
