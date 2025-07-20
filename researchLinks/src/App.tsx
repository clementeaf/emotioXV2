import { useState } from 'react';
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import CompletedPage from './pages/CompletedPage';
import DisqualifiedPage from './pages/DisqualifiedPage';
import ExceededPage from './pages/ExceededPage';

function HomePage() {
  const [links] = useState([
    {
      id: 'completed',
      title: 'Entrevistas Completadas',
      description: 'Módulo para participantes que completaron la investigación',
      url: '/completed',
      color: 'bg-green-500'
    },
    {
      id: 'disqualified',
      title: 'Entrevistas Descalificadas',
      description: 'Módulo para participantes descalificados',
      url: '/disqualified',
      color: 'bg-red-500'
    },
    {
      id: 'exceeded',
      title: 'Entrevistas Excedidas',
      description: 'Módulo para participantes que excedieron el tiempo',
      url: '/exceeded',
      color: 'bg-yellow-500'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔗 ResearchLinks - Enlaces de Retorno
          </h1>
          <p className="text-gray-600">
            Módulos para diferentes tipos de entrevistas
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {links.map((link) => (
            <div key={link.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className={`w-12 h-12 rounded-lg ${link.color} mb-4 flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">
                    {link.id.charAt(0).toUpperCase()}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {link.title}
                </h3>

                <p className="text-gray-600 mb-4">
                  {link.description}
                </p>

                <Link
                  to={link.url}
                  className={`${link.color} hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg inline-block transition-opacity`}
                >
                  🔗 Ir al módulo
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Los participantes serán dirigidos a estos módulos según su estado en la investigación</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/completed" element={<CompletedPage />} />
        <Route path="/disqualified" element={<DisqualifiedPage />} />
        <Route path="/exceeded" element={<ExceededPage />} />
      </Routes>
    </Router>
  );
}

export default App;
