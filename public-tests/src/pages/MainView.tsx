import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import fondoImage from '../assets/fondo.png';
import { 
  CSATView, 
  DifficultyScaleView,
  AgreementScaleView,
  EmotionSelectionView,
  FeedbackView,
  ThankYouView
} from '../components/smartVoc';
import { CognitiveTaskView } from '../components/cognitiveTask';

// Componente para la pantalla de bienvenida inicial actualizada (pantalla completa)
const WelcomeScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="flex w-full h-full">
      {/* Lado izquierdo - Pantalla de bienvenida */}
      <div className="w-1/2 bg-white flex flex-col justify-center p-12">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">Hello! You has been invited</h1>
        
        <p className="text-neutral-600 mb-8 leading-relaxed">
          You have been invited to participate in a survey to improve the future experience of our customers, 
          so we need your help to make this the best experience possible.
        </p>
        
        <button
          className="bg-[#121829] hover:bg-[#1e293e] text-white font-medium py-3 px-10 rounded-lg w-fit transition-colors shadow-sm"
          onClick={onStart}
        >
          Start
        </button>
      </div>

      {/* Lado derecho - Vista previa con imagen de fondo */}
      <div className="w-1/2 relative">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <img 
            src={fondoImage} 
            alt="Elegant background" 
            className="w-full h-full object-cover"
          />
          {/* Overlay sutil para mejorar la visibilidad */}
          <div className="absolute inset-0 bg-black opacity-20"></div>
        </div>

        {/* Footer derecho */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 py-1.5 px-6 text-xs text-neutral-500 flex justify-end backdrop-blur-sm bg-white/90">
          <div className="flex gap-6">
            <a href="#" className="text-neutral-700 hover:text-neutral-900 transition-colors">Terms & Conditions</a>
            <a href="#" className="text-neutral-700 hover:text-neutral-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-neutral-700 hover:text-neutral-900 transition-colors">CA Privacy Notice</a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para la pantalla de Screener (ejemplo)
const ScreenerView = () => {
  return (
    <div className="flex w-full h-full">
      <div className="w-full p-10 bg-white">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Screener</h1>
        <p className="text-neutral-600 mb-4">
          Please answer the following screening questions to help us determine your eligibility for this survey.
        </p>
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">How often do you use our service?</label>
            <select className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900">
              <option value="">Select an option</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="rarely">Rarely</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">What is your age range?</label>
            <select className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900">
              <option value="">Select an option</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55+">55+</option>
            </select>
          </div>
          <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-10 rounded-lg w-fit transition-colors shadow-sm">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// Tipos de pantallas disponibles
type ScreenType = 'welcome' | 'csat' | 'difficulty-scale' | 'agreement-scale' | 'emotion-selection' | 'feedback' | 'screener' | 'implicit' | 'cognitive' | 'eye-tracking' | 'thank-you';

const MainView = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Menú cerrado por defecto
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('welcome');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef, buttonRef]);

  // Función para cambiar a otra pantalla
  const handleStartClick = () => {
    setCurrentScreen('csat');
    console.log("Changing to CSAT screen");
  };
  
  const handleCSATNext = () => {
    setCurrentScreen('difficulty-scale');
  };
  
  const handleDifficultyContinue = () => {
    setCurrentScreen('agreement-scale');
  };
  
  const handleAgreementContinue = () => {
    setCurrentScreen('emotion-selection');
  };
  
  const handleEmotionContinue = () => {
    setCurrentScreen('feedback');
  };
  
  const handleFeedbackContinue = () => {
    setCurrentScreen('thank-you');
  };

  const handleThankYouContinue = () => {
    setCurrentScreen('cognitive');
  };

  // Función para manejar la selección del menú
  const handleMenuSelect = (screen: ScreenType) => {
    setCurrentScreen(screen);
    setIsMenuOpen(false);
  };

  // Opciones del menú
  const menuOptions = [
    { id: 'welcome', label: 'Inicio' },
    { id: 'csat', label: 'CSAT' },
    { id: 'difficulty-scale', label: 'Escala de Dificultad' },
    { id: 'agreement-scale', label: 'Escala de Acuerdo' },
    { id: 'emotion-selection', label: 'Selección de Emociones' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'thank-you', label: 'Agradecimiento' },
    { id: 'cognitive', label: 'Tarea Cognitiva' },
    { id: 'screener', label: 'Screener' },
    { id: 'implicit', label: 'Asociación Implícita' },
    { id: 'eye-tracking', label: 'Eye Tracking' },
  ];

  // Renderiza el contenido basado en la pantalla seleccionada
  const renderContent = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onStart={handleStartClick} />;
      case 'csat':
        return <CSATView onNext={handleCSATNext} />;
      case 'difficulty-scale':
        return <DifficultyScaleView onContinue={handleDifficultyContinue} />;
      case 'agreement-scale':
        return <AgreementScaleView onContinue={handleAgreementContinue} />;
      case 'emotion-selection':
        return <EmotionSelectionView onContinue={handleEmotionContinue} />;
      case 'feedback':
        return <FeedbackView onContinue={handleFeedbackContinue} />;
      case 'screener':
        return <ScreenerView />;
      case 'implicit':
        return <div className="p-10 bg-white"><h1 className="text-2xl font-bold">Implicit Association</h1></div>;
      case 'cognitive':
        return <CognitiveTaskView onComplete={() => handleMenuSelect('welcome')} />;
      case 'eye-tracking':
        return <div className="p-10 bg-white"><h1 className="text-2xl font-bold">Eye Tracking</h1></div>;
      case 'thank-you':
        return <ThankYouView onContinue={handleThankYouContinue} />;
      default:
        return <WelcomeScreen onStart={handleStartClick} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50">
      {/* Banner - posición fija con ancho completo */}
      <div className="fixed top-0 left-0 w-full bg-[#121829] z-50 shadow-md">
        <div className="flex w-full max-w-screen-xl mx-auto">
          <div className="w-full py-4 px-6 flex items-center justify-between relative">
            <div className="flex items-center">
              <span className="bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center mr-2 shadow-sm">😀</span>
              <span className="font-medium text-white text-lg">EmotioX</span>
            </div>
            <div className="flex-1 text-center text-white text-sm mx-4">
              This is a preview. Your response will not be saved.
            </div>
            <div className="relative">
              <button 
                ref={buttonRef}
                className="bg-[#1e293e] hover:bg-[#29344f] text-white px-4 py-2 rounded-lg flex items-center text-sm mr-4 transition-colors shadow-sm"
                onClick={toggleMenu}
              >
                Jump to section <ChevronRight size={16} className="ml-2" />
              </button>

              {/* Menú desplegable - ahora alineado con el margen izquierdo del botón */}
              {isMenuOpen && (
                <div 
                  ref={menuRef}
                  className="absolute left-0 top-[53px] w-[180px] bg-white border border-neutral-100 shadow-xl rounded-xl overflow-hidden z-10"
                >
                  <ul>
                    {menuOptions.map((option) => (
                      <li 
                        key={option.id}
                        className="px-5 py-3 hover:bg-neutral-100 cursor-pointer text-sm font-medium"
                        onClick={() => handleMenuSelect(option.id as ScreenType)}
                      >
                        {option.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor principal - ahora dinámico basado en currentScreen */}
      <div className="flex w-full h-full mt-[64px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainView; 