import { useState } from 'react';

interface SocialMediaTaskProps {
  onContinue: () => void;
}

// Componente para la tarea de selección de redes sociales
const SocialMediaTask = ({ onContinue }: SocialMediaTaskProps) => {
  const [selectedNetworks, setSelectedNetworks] = useState<Record<string, boolean>>({
    facebook: true,    // Facebook viene preseleccionado por defecto
    linkedin: false,
    x: false,
    instagram: false,
    tiktok: false
  });
  
  const handleNetworkChange = (network: string) => {
    setSelectedNetworks({
      ...selectedNetworks,
      [network]: !selectedNetworks[network]
    });
  };
  
  const handleContinue = () => {
    // Aquí podríamos procesar las redes sociales seleccionadas
    const selected = Object.entries(selectedNetworks)
      .filter(([_, isSelected]) => isSelected)
      .map(([network]) => network);
    
    console.log('Redes sociales seleccionadas:', selected);
    onContinue();
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-8">
          ¿Dónde tienes cuentas?
        </h2>
        
        <div className="w-full max-w-sm">
          <div className="space-y-4 mb-8">
            <label className="flex items-center space-x-3 p-2 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedNetworks.facebook}
                onChange={() => handleNetworkChange('facebook')}
              />
              <span className="text-neutral-700">Facebook</span>
            </label>
            
            <label className="flex items-center space-x-3 p-2 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedNetworks.linkedin}
                onChange={() => handleNetworkChange('linkedin')}
              />
              <span className="text-neutral-700">LinkedIn</span>
            </label>
            
            <label className="flex items-center space-x-3 p-2 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedNetworks.x}
                onChange={() => handleNetworkChange('x')}
              />
              <span className="text-neutral-700">X</span>
            </label>
            
            <label className="flex items-center space-x-3 p-2 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedNetworks.instagram}
                onChange={() => handleNetworkChange('instagram')}
              />
              <span className="text-neutral-700">Instagram</span>
            </label>
            
            <label className="flex items-center space-x-3 p-2 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedNetworks.tiktok}
                onChange={() => handleNetworkChange('tiktok')}
              />
              <span className="text-neutral-700">TikTok</span>
            </label>
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              onClick={handleContinue}
              className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-10 rounded w-32 transition-colors shadow-sm"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaTask; 