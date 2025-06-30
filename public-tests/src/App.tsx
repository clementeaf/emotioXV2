import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ApiTester } from './components/ApiTester';
import './index.css';
import GDPRTestPage from './pages/GDPRTestPage';
import ParticipantFlow from './pages/ParticipantFlow';
import PrivacyNoticePage from './pages/PrivacyNoticePage';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const researchId = params.get('researchId');

    // Manejar hash para test GDPR
    if (location.hash === '#gdpr-test') {
      navigate('/gdpr-test');
      return;
    }

    // Manejar hash para aviso de privacidad
    if (location.hash === '#privacy') {
      navigate('/privacy');
      return;
    }

    if (researchId) {
      navigate(`/link/${researchId}`);
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido a Public Tests
          </h1>
          <p className="text-gray-600">
            Plataforma de testing para investigaciones de usabilidad y experiencia de usuario
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              ¿Qué desea hacer?
            </h2>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">🔬 Participar en una Investigación</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Agregue un researchId en la URL para acceder a una investigación específica
                </p>
                <p className="text-xs text-gray-500">
                  Ejemplo: <code className="bg-gray-100 px-2 py-1 rounded">?researchId=test-123</code>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="/gdpr-test"
                  className="block p-4 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-medium text-blue-900 mb-1">🔒 Test GDPR</h3>
                  <p className="text-sm text-blue-700">
                    Probar el sistema de consentimiento GDPR
                  </p>
                </a>

                <a
                  href="/privacy"
                  className="block p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <h3 className="font-medium text-green-900 mb-1">📋 Aviso de Privacidad</h3>
                  <p className="text-sm text-green-700">
                    Ver el aviso de privacidad completo
                  </p>
                </a>

                <a
                  href="/api-test"
                  className="block p-4 border border-purple-200 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <h3 className="font-medium text-purple-900 mb-1">🔧 Test API</h3>
                  <p className="text-sm text-purple-700">
                    Probar endpoints de la API
                  </p>
                </a>

                <a
                  href="/#privacy"
                  className="block p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1">📖 Documentación</h3>
                  <p className="text-sm text-gray-700">
                    Ver documentación del proyecto
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              © 2024 EmotioX Research Platform. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 transition-colors">
                Aviso de Privacidad
              </a>
              <a href="/terms" className="text-blue-600 hover:text-blue-800 transition-colors">
                Términos y Condiciones
              </a>
              <a href="/cookies" className="text-blue-600 hover:text-blue-800 transition-colors">
                Política de Cookies
              </a>
              <a href="mailto:privacy@emotiox.com" className="text-blue-600 hover:text-blue-800 transition-colors">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/api-test" element={<ApiTester />} />
        <Route path="/link/:researchId" element={<ParticipantFlow />} />
        <Route path="/gdpr-test" element={<GDPRTestPage />} />
        <Route path="/privacy" element={<PrivacyNoticePage />} />
      </Routes>
    </Router>
  );
}

export default App;
