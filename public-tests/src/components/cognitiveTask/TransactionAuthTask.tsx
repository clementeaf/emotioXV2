import { useState } from 'react';
// Eliminar importaciones de imágenes que causan errores
// import capitalDesktopImage from '../../assets/capital-desktop.png'; 
// import capitalMobileImage from '../../assets/capital-mobile.png';

// Tipo para los formatos de visualización
type ViewFormat = 'text-only' | 'desktop-image' | 'mobile-image' | 'long-text';

interface TransactionAuthTaskProps {
  onContinue: () => void;
  viewFormat?: ViewFormat; // Formato opcional, por defecto será 'desktop-image'
}

// Componente para la tarea de identificación de interfaz para autorizar transacciones
const TransactionAuthTask = ({ onContinue, viewFormat = 'desktop-image' }: TransactionAuthTaskProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [longText, setLongText] = useState<string>('');
  
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setError(null);
  };
  
  const handleLongTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLongText(e.target.value);
  };
  
  const handleContinue = () => {
    // Para formatos con opción de selección
    if ((viewFormat === 'desktop-image' || viewFormat === 'mobile-image') && !selectedOption) {
      setError('Por favor, selecciona una opción antes de continuar');
      return;
    }
    
    if (viewFormat === 'desktop-image' || viewFormat === 'mobile-image') {
      console.log('Opción seleccionada:', selectedOption);
    } else if (viewFormat === 'long-text') {
      console.log('Texto largo ingresado:', longText);
    }
    
    onContinue();
  };
  
  // Las opciones disponibles para la selección
  const options = [
    { id: 'dashboard', label: 'Panel de inversiones' },
    { id: 'transaction', label: 'Detalle de transacción' },
    { id: 'advisor', label: 'Consulta con asesor' }
  ];

  // Título según el formato
  const getTitle = () => {
    if (viewFormat === 'text-only' || viewFormat === 'long-text') {
      return '¿Cómo resolverías el problema?';
    }
    return '¿Con cuál de las pantallas puedes autorizar una transacción?';
  };

  // Contenido según el formato
  const renderContent = () => {
    // Formato de texto largo
    if (viewFormat === 'long-text') {
      return (
        <div className="w-full max-w-md mb-6">
          <p className="text-neutral-600 mb-6 text-center">
            No problem. Just let us know your email address and we'll email you a password reset link that will allow 
            you to choose a new one. You a password reset link.
          </p>
          
          <div className="w-full mb-2">
            <textarea
              placeholder="Me siento honrado de opinar..."
              value={longText}
              onChange={handleLongTextChange}
              className="w-full h-24 p-3 border border-neutral-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
          
          <div className="w-full flex justify-end text-xs text-neutral-400">
            {longText.length}/100
          </div>
        </div>
      );
    }
    
    // Formato de texto corto
    if (viewFormat === 'text-only') {
      return (
        <div className="w-full max-w-md mb-6">
          <p className="text-neutral-600 mb-6 text-center">
            No problem. Just let us know your email address and we'll email you a password reset link that will allow 
            you to choose a new one. You a password reset link.
          </p>
          
          <div className="w-full mb-6">
            <input
              type="email"
              placeholder="Email@dominio.com"
              className="w-full p-2.5 border border-neutral-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>
      );
    }

    // Formatos con imagen - Reemplazamos con div de marcador de posición
    return (
      <>
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Reemplazar imagen con un div estilizado */}
          <div 
            className={`w-full h-64 ${viewFormat === 'mobile-image' ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}
          >
            <div className="text-center p-6">
              <div className="text-xl font-semibold mb-2">
                {viewFormat === 'mobile-image' ? 'Interfaz móvil de Capital' : 'Interfaz desktop de Capital'}
              </div>
              <p className="text-gray-600">
                Esta es una representación del diseño de la interfaz {viewFormat === 'mobile-image' ? 'móvil' : 'de escritorio'}
                para la autorización de transacciones.
              </p>
            </div>
          </div>
          <div className="p-3 flex justify-end">
            <button className="text-xs text-indigo-600 flex items-center gap-1">
              Expandir imagen
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="w-full max-w-lg space-y-3 mb-6">
          {options.map((option) => (
            <label 
              key={option.id}
              className={`flex items-center p-3 rounded-lg border ${
                selectedOption === option.id 
                  ? 'border-indigo-600 bg-indigo-50' 
                  : 'border-neutral-300 hover:bg-neutral-50'
              } cursor-pointer transition-colors`}
            >
              <input
                type="radio"
                name="transaction-auth-option"
                className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedOption === option.id}
                onChange={() => handleOptionSelect(option.id)}
              />
              <span className="ml-3 text-neutral-700">{option.label}</span>
            </label>
          ))}
        </div>
      </>
    );
  };
  
  // Fondo según la vista
  const getBgColor = () => {
    return (viewFormat === 'text-only' || viewFormat === 'long-text') ? 'bg-white' : 'bg-blue-50';
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full h-full ${getBgColor()} p-6`}>
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-6">
          {getTitle()}
        </h2>
        
        {renderContent()}
        
        {error && (
          <p className="text-red-500 text-sm mt-1 mb-4">
            {error}
          </p>
        )}
        
        <div className="flex justify-center mt-4">
          <button
            onClick={handleContinue}
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-10 rounded w-32 transition-colors shadow-sm"
          >
            Continuar
          </button>
        </div>
        
        {/* Footer - solo para vistas con imagen */}
        {(viewFormat !== 'text-only' && viewFormat !== 'long-text') && (
          <div className="w-full text-xs text-neutral-500 mt-8 flex justify-between">
            <div>
              This site is protected by reCAPTCHA and the Google <a href="#" className="text-indigo-600">Privacy Policy</a>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-neutral-600 hover:text-neutral-800">Terms and Conditions</a>
              <a href="#" className="text-neutral-600 hover:text-neutral-800">Privacy Policy</a>
              <a href="#" className="text-neutral-600 hover:text-neutral-800">CA Privacy Notice</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionAuthTask; 