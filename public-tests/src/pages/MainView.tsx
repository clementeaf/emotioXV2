import React, { useState, useEffect } from 'react';
// import { ChevronRight } from 'lucide-react'; // Eliminar
import { 
  CSATView, 
  // DifficultyScaleView, // Eliminar
  // AgreementScaleView, // Eliminar
  // EmotionSelectionView, // Eliminar
  FeedbackView,
  ThankYouView
} from '../components/smartVoc';
// import { CognitiveTaskView } from '../components/cognitiveTask'; // Eliminar
import { ParticipantLogin } from '../components/auth/ParticipantLogin';
import { Participant } from '../../../shared/interfaces/participant';
import { ProgressSidebar, Step as SidebarStep } from '../components/layout/ProgressSidebar';
// import { cn } from '../lib/utils'; // Eliminar

// Eliminar componente no usado
/*
const ScreenerView = () => {
  // ... 
};
*/

// Eliminar tipo no usado
// type ScreenType = 'login' | 'welcome' | 'csat' | 'difficulty-scale' | 'agreement-scale' | 'emotion-selection' | 'feedback' | 'screener' | 'implicit' | 'cognitive' | 'eye-tracking' | 'thank-you';

// --- Placeholder Data (Simula la lista expandida de pasos/preguntas) ---
// En un escenario real, esto se generaría dinámicamente después de hacer fetch
// de la configuración del flujo y los detalles de las preguntas.
const placeholderExpandedSteps: (SidebarStep & { type: string, config?: any })[] = [
  { id: 'welcome', name: 'Bienvenida', type: 'welcome', config: { title: '¡Hola!', message: 'Gracias por participar en esta investigación.'} },
  { id: 'cog_instr', name: 'Instrucciones Tarea', type: 'instruction', config: { title: 'Instrucciones', text: 'A continuación, responderás algunas preguntas breves.' } },
  { id: 'cog_q1', name: 'Pregunta 1', type: 'cognitive_short_text', config: { questionText: '¿Cuál es tu color favorito?' } },
  { id: 'cog_q2', name: 'Pregunta 2', type: 'cognitive_short_text', config: { questionText: '¿Cuál es la capital de España?' } },
  { id: 'sv_instr', name: 'Instrucciones Feedback', type: 'instruction', config: { title: 'Feedback', text: 'Ahora, danos tu opinión sobre la experiencia.'} },
  { id: 'sv_q1', name: 'Satisfacción', type: 'smartvoc_csat', config: { questionText: 'En una escala de 1 a 5, ¿qué tan satisfecho estás?' , scaleSize: 5} },
  { id: 'sv_q2', name: 'Comentarios', type: 'smartvoc_feedback', config: { questionText: '¿Tienes algún comentario adicional?' } },
  { id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', config: { title: '¡Gracias!', message: 'Hemos recibido tus respuestas.' } },
];
// ----------------------------------------------------------------------

const MainView = () => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [researchId] = useState<string>("1"); // ID Fijo para demo
  const [isLoadingFlow, setIsLoadingFlow] = useState<boolean>(true);
  const [expandedSteps, setExpandedSteps] = useState<(SidebarStep & { type: string, config?: any })[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    // Simular login (en una app real, esto vendría de un contexto de auth o similar)
    const loginTimeout = setTimeout(() => {
        console.log("[MainView] Simulando login...");
        const simulatedParticipant: Participant = { 
            name: 'Participante Prueba', 
            email: 'participante@test.com' 
        };
        setParticipant(simulatedParticipant);
    }, 300);

    // Simular carga del flujo y construcción de la lista expandida
    // Aquí iría la lógica real de fetch:
    // 1. Fetch /forms para obtener la lista general de pasos (WELCOME, COGNITIVE_TASK, SMARTVOC, THANK_YOU)
    // 2. Si COGNITIVE_TASK está presente, fetch su configuración detallada (incluyendo 'questions')
    // 3. Si SMARTVOC está presente, fetch su configuración detallada (incluyendo 'questions')
    // 4. Construir 'expandedSteps' combinando los pasos generales y las preguntas individuales.
    const flowLoadTimeout = setTimeout(() => {
        console.log("[MainView] Simulando carga de flujo...");
        // Usamos los datos placeholder por ahora
        setExpandedSteps(placeholderExpandedSteps); 
        setCurrentStepIndex(0); // Empezar en el primer paso
        setIsLoadingFlow(false);
        console.log("[MainView] Flujo cargado (simulado). Pasos:", placeholderExpandedSteps);
    }, 800); // Darle un poco más de tiempo que al login

    return () => {
        clearTimeout(loginTimeout);
        clearTimeout(flowLoadTimeout);
    };
  }, []); // Ejecutar solo al montar

  const handleParticipantLogin = (participantData: Participant) => {
    console.log("[MainView] Login real completado:", participantData);
    setParticipant(participantData);
    setIsLoadingFlow(true); // Indicar que estamos cargando el flujo después del login
    // Aquí se dispararía la lógica real de carga del flujo que está simulada en useEffect
  };

  const goToNextStep = (answer?: any) => { 
    const currentStep = expandedSteps[currentStepIndex];
    console.log(`[MainView] Avanzando desde paso ${currentStepIndex} (${currentStep?.id}). Respuesta:`, answer); 
    // Opcional: Guardar la respuesta
    // if (currentStep && answer !== undefined) {
    //   setAllAnswers(prev => ({ ...prev, [currentStep.id]: answer }));
    // }

    if (currentStepIndex < expandedSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      console.log("[MainView] Flujo completado!");
      // Podríamos cambiar a un estado 'completed' o mostrar un mensaje final distinto
      setCurrentStepIndex(currentStepIndex); // Quedarse en el último paso (ThankYou)
    }
  };

  const renderCurrentStepContent = () => {
    if (isLoadingFlow || expandedSteps.length === 0 || !participant) {
      if (!isLoadingFlow && expandedSteps.length === 0){
          return <div className="flex items-center justify-center h-full w-full p-8 text-center text-red-600">Error al cargar la configuración del flujo o no se encontraron pasos.</div>;
      }
      return <div className="flex items-center justify-center h-full w-full">Cargando...</div>;
    }
    
    const currentStep = expandedSteps[currentStepIndex];
    if (!currentStep) {
        console.error(`[MainView] Error: No se encontró el paso en el índice ${currentStepIndex}`);
        return <div className="flex items-center justify-center h-full w-full p-8 text-center text-red-600">Error interno: No se pudo encontrar el paso actual.</div>;
    }

    const stepWrapperClasses = "flex flex-col items-center justify-center min-h-full w-full p-4 sm:p-8";

    switch (currentStep.type) {
      case 'welcome':
        return (
            <div className={stepWrapperClasses}>
                <div className="bg-white p-8 rounded-lg shadow-md max-w-lg text-center">
                    <h1 className="text-3xl font-bold mb-4 text-neutral-800">{currentStep.config?.title || 'Bienvenida'}</h1>
                    <p className="text-neutral-600 mb-6">{currentStep.config?.message || 'Gracias por participar.'}</p>
                    <button onClick={() => goToNextStep()} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                        Comenzar
                    </button>
                </div>
            </div>
        );
       case 'instruction': 
         return (
             <div className={stepWrapperClasses}>
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg">
                    <h1 className="text-2xl font-semibold mb-4 text-neutral-800">{currentStep.config?.title || 'Instrucciones'}</h1>
                    <p className="text-neutral-600 mb-6">{currentStep.config?.text}</p>
                    <button onClick={() => goToNextStep()} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                        Entendido
                    </button>
                </div>
            </div>
        );
      case 'cognitive_short_text': 
        return (
            <div className={stepWrapperClasses}>
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                    <h2 className="text-xl font-medium mb-3 text-neutral-700">{currentStep.name}</h2>
                    <p className="text-neutral-600 mb-4">{currentStep.config?.questionText}</p>
                    <input 
                        type="text" 
                        className="border border-neutral-300 p-2 rounded-md w-full mb-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                        placeholder="Escribe tu respuesta..."
                    />
                    <button 
                        onClick={() => goToNextStep("Respuesta placeholder...")} 
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
         );
        
      case 'smartvoc_csat':
         return (
            <div className={stepWrapperClasses}>
                 <CSATView 
                    questionText={currentStep.config?.questionText} 
                    scaleSize={currentStep.config?.scaleSize}
                    onNext={goToNextStep}
                />
            </div>
           );
      case 'smartvoc_feedback':
          return (
             <div className={stepWrapperClasses}>
                 <FeedbackView 
                    questionText={currentStep.config?.questionText}
                    onNext={(textAnswer: string) => goToNextStep(textAnswer)}
                 />
            </div>
            );

      case 'thankyou':
        return (
            <div className={stepWrapperClasses}>
                 <ThankYouView 
                     onContinue={() => console.log("Acción final desde ThankYou (si la hay)")} 
                 /> 
            </div>
           );

      default:
        console.warn(`[MainView] Tipo de paso no reconocido: ${currentStep.type}`);
        return (
            <div className={stepWrapperClasses}>
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg text-center text-red-600">
                    <p>Error: Tipo de paso '{currentStep.type}' no implementado.</p>
                 </div>
            </div>
        );
    }
    console.warn("[MainView] renderCurrentStepContent alcanzó el final sin devolver un elemento.")
    return null; 
  };

  if (participant === null && isLoadingFlow) {
        return <div className="flex items-center justify-center h-screen w-screen bg-neutral-50">Cargando sesión...</div>;
   }

   if (!participant) {
       return <ParticipantLogin onLogin={handleParticipantLogin} researchId={researchId} />;
   }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100">
        <ProgressSidebar 
            steps={expandedSteps.map(step => ({ id: step.id, name: step.name }))} 
            currentStepIndex={currentStepIndex} 
        />

        <main className="flex-1 overflow-y-auto bg-white"> 
            {renderCurrentStepContent()}
        </main>
    </div>
  );
};

export default MainView; 