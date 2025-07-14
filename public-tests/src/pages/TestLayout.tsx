import React from 'react';

const TestLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">Test de Participante</h1>
                <p className="text-sm text-gray-500">Completa la investigación siguiendo las instrucciones</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Bienvenido al Test
          </h2>
          <p className="text-gray-600 mb-6">
            Esta es la página principal del test. Aquí se mostrará el contenido del flujo de participación.
          </p>

          {/* Aquí irá el contenido del flujo */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">Contenido del flujo de participación</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2024 EmotioX. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TestLayout;
