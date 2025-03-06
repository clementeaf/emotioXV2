import { useState } from 'react';

interface NavigationFlowTaskProps {
  onContinue: () => void;
  title?: string;
  instructions?: string;
  question?: string;
  footerText?: string;
}

const NavigationFlowTask = ({ 
  onContinue, 
  title = 'Navegación de flujo - Desktop',
  question = '¿En cuál de las siguientes pantallas encuentras X objetivo?',
  instructions = 'Haz clic en una opción para ver en detalle',
  footerText = 'Revisa todas las pantallas antes de elegir una únicamente'
}: NavigationFlowTaskProps) => {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [selectedScreen, setSelectedScreen] = useState<number | null>(null);

  // Las pantallas disponibles para navegar
  const screens = [
    {
      id: 'screen-1',
      name: 'Dashboard Principal',
      content: (
        <div className="w-full h-full bg-white rounded border border-gray-200 p-3">
          <div className="bg-indigo-800 text-white p-2 rounded-t text-sm">
            <div className="flex justify-between items-center">
              <span>Bienvenido a tu sucursal virtual</span>
              <span>•</span>
            </div>
            <div className="text-xl font-bold mt-1">$123.456.789.444</div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">Ahorro y cuentas activas</div>
          
          {/* Primera cuenta */}
          <div className="border rounded mt-1 p-2 flex justify-between items-center">
            <div>
              <div className="font-medium">Ahorro Obligatorio</div>
              <div className="text-sm text-gray-600">$123.456.789.444</div>
              <div className="text-xs text-gray-500">Saldo al: Oct 9, 2023</div>
            </div>
            <div className="text-gray-400">›</div>
          </div>
          
          {/* Segunda cuenta */}
          <div className="border rounded mt-2 p-2 flex justify-between items-center">
            <div>
              <div className="font-medium">AVC - Ahorro Voluntario</div>
              <div className="text-sm text-gray-600">$123.456.789.444</div>
              <div className="text-xs text-gray-500">Saldo al: Oct 9, 2023</div>
            </div>
            <div className="text-gray-400">›</div>
          </div>
          
          {/* Tercera cuenta */}
          <div className="border rounded mt-2 p-2 flex justify-between items-center">
            <div>
              <div className="font-medium">Cuenta 2 - Ahorro Voluntario</div>
              <div className="text-sm text-gray-600">$123.456.789.444</div>
              <div className="text-xs text-gray-500">Saldo al: Oct 9, 2023</div>
            </div>
            <div className="text-gray-400">›</div>
          </div>
          
          {/* Evolución de saldo */}
          <div className="mt-3">
            <div className="text-xs text-gray-500">Evolución de saldo</div>
            <div className="text-sm font-medium">$123.456.789.444</div>
            
            <div className="text-xs text-gray-500 mt-1">Comparación por período</div>
            
            <div className="flex gap-2 text-xs mt-1">
              <button className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">12 meses</button>
              <button className="bg-white text-gray-500 px-2 py-1 rounded border">3 meses</button>
              <button className="bg-white text-gray-500 px-2 py-1 rounded border">1 mes</button>
            </div>
            
            <div className="flex gap-2 text-xs mt-2">
              <div className="flex items-center">
                <span className="h-2 w-2 bg-indigo-600 rounded-full inline-block mr-1"></span>
                <span>AVC</span>
              </div>
              <div className="flex items-center">
                <span className="h-2 w-2 bg-blue-400 rounded-full inline-block mr-1"></span>
                <span>APV</span>
              </div>
            </div>
            
            {/* Gráfico simplificado */}
            <div className="h-20 mt-1 border-b border-l relative">
              <div className="absolute bottom-0 left-0 w-full h-16 flex items-end">
                <div className="border-r border-dashed border-blue-300 h-10 w-1/6"></div>
                <div className="border-r border-dashed border-blue-300 h-8 w-1/6"></div>
                <div className="border-r border-dashed border-blue-300 h-12 w-1/6"></div>
                <div className="border-r border-dashed border-blue-300 h-14 w-1/6"></div>
                <div className="border-r border-dashed border-blue-300 h-9 w-1/6"></div>
                <div className="h-16 w-1/6"></div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-16">
                <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
                  <path d="M0,15 L16,12 L33,10 L50,7 L66,8 L100,5" fill="none" stroke="#818cf8" strokeWidth="1.5"></path>
                  <path d="M0,18 L16,16 L33,14 L50,12 L66,8 L100,10" fill="none" stroke="#4f46e5" strokeWidth="1.5"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'screen-2',
      name: 'Detalle de Cuenta',
      content: (
        <div className="w-full h-full bg-white rounded border border-gray-200 p-3">
          <div className="bg-indigo-700 text-white p-3 rounded-t">
            <div className="text-sm mb-1">Detalle de cuenta</div>
            <div className="text-xl font-bold">Ahorro Obligatorio</div>
            <div className="mt-2 text-2xl font-bold">$123.456.789.444</div>
            <div className="text-xs mt-1">Saldo disponible</div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between border-b pb-2">
              <div className="text-gray-600">Número de cuenta</div>
              <div className="font-medium">123456789</div>
            </div>
            
            <div className="flex justify-between border-b py-2">
              <div className="text-gray-600">Tipo de cuenta</div>
              <div className="font-medium">Ahorro Obligatorio</div>
            </div>
            
            <div className="flex justify-between border-b py-2">
              <div className="text-gray-600">Estado</div>
              <div className="font-medium text-green-600">Activa</div>
            </div>
            
            <div className="flex justify-between py-2">
              <div className="text-gray-600">Fecha de apertura</div>
              <div className="font-medium">01/01/2020</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="font-medium text-lg">Movimientos recientes</div>
            
            <div className="mt-2 border rounded p-2">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">Aporte mensual</div>
                  <div className="text-xs text-gray-500">10 Oct 2023</div>
                </div>
                <div className="text-green-600 font-medium">+ $1.500.000</div>
              </div>
            </div>
            
            <div className="mt-2 border rounded p-2">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">Rendimientos</div>
                  <div className="text-xs text-gray-500">05 Oct 2023</div>
                </div>
                <div className="text-green-600 font-medium">+ $235.890</div>
              </div>
            </div>
            
            <div className="mt-2 border rounded p-2">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">Aporte mensual</div>
                  <div className="text-xs text-gray-500">10 Sep 2023</div>
                </div>
                <div className="text-green-600 font-medium">+ $1.500.000</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'screen-3',
      name: 'Configuración de Perfil',
      content: (
        <div className="w-full h-full bg-white rounded border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold">Perfil de Usuario</div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-bold">
              JD
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Información personal</div>
            <div className="border rounded p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Nombre completo</div>
                  <div className="font-medium">Juan Pérez Gómez</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Tipo de documento</div>
                  <div className="font-medium">CC</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Número de documento</div>
                  <div className="font-medium">1234567890</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Fecha de nacimiento</div>
                  <div className="font-medium">15/04/1985</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Información de contacto</div>
            <div className="border rounded p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Correo electrónico</div>
                  <div className="font-medium">juan.perez@example.com</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Teléfono celular</div>
                  <div className="font-medium">+57 300 123 4567</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Ciudad</div>
                  <div className="font-medium">Bogotá</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Dirección</div>
                  <div className="font-medium">Calle 123 # 45-67</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500 mb-1">Preferencias</div>
            <div className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div>Recibir notificaciones por email</div>
                <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 bg-white w-4 h-4 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div>Recibir notificaciones por SMS</div>
                <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 bg-white w-4 h-4 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>Compartir datos para mejores ofertas</div>
                <div className="w-10 h-5 bg-gray-300 rounded-full relative">
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];
  
  const handleNext = () => {
    if (currentScreenIndex < screens.length - 1) {
      setCurrentScreenIndex(currentScreenIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentScreenIndex > 0) {
      setCurrentScreenIndex(currentScreenIndex - 1);
    }
  };
  
  const handleSelectScreen = () => {
    setSelectedScreen(currentScreenIndex);
  };
  
  const handleContinue = () => {
    if (selectedScreen !== null) {
      console.log('Pantalla seleccionada:', screens[selectedScreen].name);
      onContinue();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-6">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-6">
          {question}
        </h2>
        
        <p className="text-center text-neutral-500 text-sm mb-8">
          {instructions}
        </p>
        
        {/* Contenedor principal */}
        <div className="w-full max-w-md border border-gray-200 rounded-lg overflow-hidden mb-6">
          {screens[currentScreenIndex].content}
        </div>
        
        {/* Navegación de pantallas */}
        <div className="w-full max-w-md flex justify-between items-center mb-4">
          <button 
            onClick={handlePrevious}
            disabled={currentScreenIndex === 0}
            className={`w-12 h-12 rounded-full flex items-center justify-center 
              ${currentScreenIndex === 0 
                ? 'bg-gray-100 text-gray-400' 
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={handleSelectScreen}
            className={`px-6 py-2 rounded-full 
              ${selectedScreen === currentScreenIndex 
                ? 'bg-indigo-700 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Elegir esta opción
          </button>
          
          <button 
            onClick={handleNext}
            disabled={currentScreenIndex === screens.length - 1}
            className={`w-12 h-12 rounded-full flex items-center justify-center 
              ${currentScreenIndex === screens.length - 1 
                ? 'bg-gray-100 text-gray-400' 
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Indicadores de pantalla */}
        <div className="flex gap-2 mb-6">
          {screens.map((_, index) => (
            <div 
              key={`indicator-${index}`}
              className={`w-2 h-2 rounded-full ${
                index === currentScreenIndex 
                  ? 'bg-indigo-600' 
                  : selectedScreen === index 
                    ? 'bg-indigo-300' 
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <p className="text-center text-neutral-500 text-sm mb-8">
          {footerText}
        </p>
        
        {selectedScreen !== null && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleContinue}
              className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-10 rounded w-32 transition-colors shadow-sm"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationFlowTask; 