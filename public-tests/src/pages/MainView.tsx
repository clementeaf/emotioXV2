import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { 
  CSATView, 
  DifficultyScaleView,
  AgreementScaleView,
  EmotionSelectionView,
  FeedbackView,
  ThankYouView
} from '../components/smartVoc';
import { CognitiveTaskView } from '../components/cognitiveTask';
import { ParticipantLogin } from '../components/auth/ParticipantLogin';
import { Participant } from '../../../shared/interfaces/participant';

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
type ScreenType = 'login' | 'welcome' | 'csat' | 'difficulty-scale' | 'agreement-scale' | 'emotion-selection' | 'feedback' | 'screener' | 'implicit' | 'cognitive' | 'eye-tracking' | 'thank-you';

const MainView = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [researchId, setResearchId] = useState<string>("1"); // ID por defecto para la investigación
  
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleParticipantLogin = (participantData: Participant) => {
    setParticipant(participantData);
    setCurrentScreen('welcome');
  };

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
    // Si no hay participante y no estamos en la pantalla de login, redirigir a login
    if (!participant && currentScreen !== 'login') {
      setCurrentScreen('login');
      return <ParticipantLogin onLogin={handleParticipantLogin} researchId={researchId} />;
    }

    switch (currentScreen) {
      case 'login':
        return <ParticipantLogin onLogin={handleParticipantLogin} researchId={researchId} />;
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
        return (
          <CognitiveTaskView 
            researchId={researchId} 
            stepId="cognitive-preview"
            stepConfig={{ 
              id: 'preview-task', 
              researchId: researchId, 
              questions: [],
              randomizeQuestions: false 
            }}
            onComplete={() => handleMenuSelect('csat')}
            onError={(err) => console.error("Error en CognitiveTaskView (preview):", err)}
            cognitiveAnswers={{}}
            onAnswerChange={() => {}}
          />
        );
      case 'eye-tracking':
        return <div className="p-10 bg-white"><h1 className="text-2xl font-bold">Eye Tracking</h1></div>;
      case 'thank-you':
        return <ThankYouView onContinue={handleThankYouContinue} />;
      default:
        return <ParticipantLogin onLogin={handleParticipantLogin} researchId={researchId} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Banner - solo mostrar si hay participante */}
      {participant && (
        <div className="fixed top-0 left-0 w-full bg-white border-b z-50">
          <div className="flex w-full max-w-screen-xl mx-auto">
            <div className="w-full py-4 px-6 flex items-center justify-between relative">
              <div className="flex items-center">
                <img src="/emotio-logo.png" alt="EmotioX" className="h-6 w-6 mr-2" />
                <span className="font-medium text-neutral-900 text-lg">EmotioX</span>
              </div>
              <div className="flex-1 text-center text-neutral-600 text-sm mx-4">
                This is a preview. Your response will not be saved.
              </div>
              <div className="relative">
                <button 
                  ref={buttonRef}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-4 py-2 rounded-lg flex items-center text-sm mr-4 transition-colors"
                  onClick={toggleMenu}
                >
                  Jump to section <ChevronRight size={16} className="ml-2" />
                </button>

                {isMenuOpen && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 top-[53px] w-[180px] bg-white border border-neutral-100 shadow-xl rounded-xl overflow-hidden z-10"
                  >
                    <ul>
                      {menuOptions.map((option) => (
                        <li 
                          key={option.id}
                          className="px-5 py-3 hover:bg-neutral-50 cursor-pointer text-sm font-medium text-neutral-900"
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
      )}

      {/* Contenedor principal - ajustar margen superior basado en si hay participante */}
      <div className={`flex w-full h-full ${participant ? 'mt-[64px]' : ''}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default MainView; 