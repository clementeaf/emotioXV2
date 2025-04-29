import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
// Importar el componente de login
import { ParticipantLogin } from '../components/auth/ParticipantLogin';
// Importar la interfaz COMPARTIDA de Participant
import { Participant } from '../../../shared/interfaces/participant';
// Importar el componente WelcomeScreen usando importación nombrada
import { WelcomeScreen } from '../components/research/WelcomeScreen/WelcomeScreen';
// Re-añadir importación para el placeholder de SmartVOCRouter
// Importar placeholders para los otros componentes
import CognitiveTaskView from '../components/cognitiveTask/CognitiveTaskView';
import { ThankYouScreen } from '../components/research/ThankYouScreen/ThankYouScreen';
import { SmartVOCRouter } from '../components/smartVoc/SmartVOCRouter';
// Importar el componente ShortTextView real usando importación nombrada
import { ShortTextView } from '../components/cognitiveTask/questions/ShortTextView';
// Los componentes Behavioural y EyeTracking siguen siendo placeholders por ahora
// import { BehaviouralTaskComponent } from '../components/behaviouralTask';
// import { EyeTrackingComponent } from '../components/eyeTracking';
// --- Importar Interfaces Compartidas --- 
import { 
    SmartVOCFormData, 
    SmartVOCQuestion 
} from '../../../shared/interfaces/smart-voc.interface';
import { 
    Question as CognitiveQuestion, // La interfaz para una pregunta individual
    QuestionType as CognitiveQuestionType, // El tipo unión para los tipos de pregunta
    CognitiveTaskFormData, // Podríamos usar esto para tipar la config general de la tarea
    CognitiveTaskModel,
    // CognitiveTaskSession, // Comentado temporalmente
    // CognitiveTaskSessionState, // Comentado temporalmente
} from '../../../shared/interfaces/cognitive-task.interface';
// Las siguientes líneas se eliminan porque los miembros no existen o se importan con 'type'
// import { CognitiveTask, CognitiveTaskSession, CognitiveTaskSessionState } from '../../../shared/interfaces/cognitive-task.interface';
// import { Research } from '../../../shared/interfaces/research.interface';
import type { ResearchRecord } from '../../../shared/interfaces/research.interface';
// Asumir una interfaz para ThankYouScreen o usar una genérica
interface ThankYouFormData { id: string; sk: 'THANK_YOU_SCREEN'; title?: string; message?: string; /*...*/ }
// Asumir interfaces genéricas o específicas para otros tipos de pasos
interface BehaviouralStepData { id: string; sk: 'BEHAVIOURAL'; /*...*/ }
interface EyeTrackingStepData { id: string; sk: 'EYE_TRACKING'; /*...*/ }

// --- Interfaz Unificada para un Paso en el Flujo --- 
// Contiene la configuración parseada específica del tipo de paso
interface FlowStep {
    id: string;
    sk: string; // 'SMART_VOC_FORM', 'COGNITIVE_TASK', etc.
    order?: number;
    title?: string;
    instructions?: string;
    config: StepConfig; // La configuración parseada
    originalData?: any; // Opcional: guardar el objeto original por si acaso
}

// Tipo Unión para la configuración parseada
type StepConfig = 
    | SmartVOCFormData 
    | CognitiveTaskFormData 
    | ThankYouFormData 
    | BehaviouralStepData 
    | EyeTrackingStepData
    | Record<string, any>; // Fallback

// --- Interfaz para un Paso del Flujo (que ahora es una Pregunta Cognitiva) --- 
interface CognitiveFlowStep {
    id: string; // ID de la pregunta (e.g., "3.1")
    sk: CognitiveQuestionType; // Tipo de la pregunta (e.g., "short_text")
    order: number; // Índice original en el array de preguntas
    config: CognitiveQuestion; // Configuración completa de ESTA pregunta
}

// --- Componentes Placeholder para Visualizar Preguntas Cognitivas ---
// (Se crearán después en /components/cognitiveTask/questions/)
// const ShortTextView = ({ config, value, onChange }: any) => <div>Short Text: {config.description} <input type="text" value={value || ''} onChange={e => onChange(config.id, e.target.value)} placeholder={config.answerPlaceholder}/></div>;
const LongTextView = ({ config, value, onChange }: any) => <div>Long Text: {config.description} <textarea value={value || ''} onChange={e => onChange(config.id, e.target.value)}/></div>;
const SingleChoiceView = ({ config, value, onChange }: any) => <div>Single Choice: {config.title} {JSON.stringify(config.choices)} (Selected: {value}) <button onClick={() => onChange(config.id, config.choices[0]?.id)}>Select 1st</button></div>;
const MultipleChoiceView = ({ config, value, onChange }: any) => <div>Multiple Choice: {config.title} {JSON.stringify(config.choices)} (Selected: {value}) <button onClick={() => onChange(config.id, [config.choices[0]?.id])}>Select 1st</button></div>;
const LikertScaleView = ({ config, value, onChange }: any) => <div>Likert Scale: {config.title} {JSON.stringify(config.options)} (Selected: {value}) <button onClick={() => onChange(config.id, config.options[0]?.value)}>Select 1st</button></div>;
const RankingView = ({ config, value, onChange }: any) => <div>Ranking: {config.title} {JSON.stringify(config.choices)} (Order: {value}) <button onClick={() => onChange(config.id, [config.choices[0]?.id])}>Rank 1st</button></div>;
const NavigationFlowView = ({ config, value, onChange }: any) => <div>Navigation Flow: {config.title} (Data: {value}) <button onClick={() => onChange(config.id, { status: 'complete' })}>Complete</button></div>;
const PreferenceTestView = ({ config, value, onChange }: any) => <div>Preference Test: {config.title} {JSON.stringify(config.files)} (Selected: {value}) <button onClick={() => onChange(config.id, config.files[0]?.id)}>Select 1st</button></div>;

interface ParticipantFlowProps {
  researchId: string;
  participantId?: string; // El ID del participante puede ser opcional inicialmente
}

// Definir el estado del flujo del participante
interface ParticipantFlowState {
  currentStep: number;
  researchData: ResearchRecord | null;
  cognitiveTaskData: CognitiveTaskModel | null;
  // sessionState: CognitiveTaskSessionState | null; // Comentado temporalmente
  isLoading: boolean;
  error: string | null;
}

const ParticipantFlow: React.FC = () => {
  const { researchId } = useParams<{ researchId: string }>();
  // Usar la interfaz importada para el estado
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // El estado 'steps' ahora contiene las PREGUNTAS individuales
  const [steps, setSteps] = useState<CognitiveFlowStep[]>([]); 
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [isFetchingTask, setIsFetchingTask] = useState<boolean>(false); // Cargando definición de Tarea Cognitiva
  const [error, setError] = useState<string | null>(null);
  // Estado para guardar las respuestas de las preguntas cognitivas
  const [cognitiveAnswers, setCognitiveAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (researchId) {
      console.log(`[ParticipantFlow] Iniciando flujo para researchId: ${researchId}`);
      const storedToken = localStorage.getItem('participantToken');
      const storedParticipant = localStorage.getItem('participantData');

      if (storedToken && storedParticipant) {
          try {
              const parsedParticipant: Participant = JSON.parse(storedParticipant);
              console.log('[ParticipantFlow] Sesión de participante encontrada en localStorage');
              setParticipant(parsedParticipant);
              setToken(storedToken);
          } catch (e) {
              console.error('[ParticipantFlow] Error parseando participante de localStorage', e);
              localStorage.removeItem('participantToken');
              localStorage.removeItem('participantData');
          }
      }
      // Ya no se llama a fetchSteps aquí, solo se marca como cargado el estado inicial
      setIsLoadingSession(false);
    } else {
      setError('No se proporcionó ID de investigación en la URL.');
      setIsLoadingSession(false);
    }
  }, [researchId]);

  const handleLoginSuccess = (loggedInParticipant: Participant) => {
    console.log('[ParticipantFlow] Login exitoso:', loggedInParticipant);
    const storedToken = localStorage.getItem('participantToken');
    if (storedToken) {
      setParticipant(loggedInParticipant);
      setToken(storedToken);
      localStorage.setItem('participantData', JSON.stringify({...loggedInParticipant, currentResearchId: researchId }));
      setError(null); // Limpiar errores previos al loguearse
    } else {
      console.error('[ParticipantFlow] Error crítico: Login exitoso pero no se encontró token en localStorage.');
      setError('Ocurrió un error al iniciar sesión. Por favor, refresca la página.');
    }
  };

  // --- MANEJO DEL FLUJO (Ahora basado en Preguntas Cognitivas) --- 

  // 1. Función para obtener la DEFINICIÓN de la Tarea Cognitiva y extraer sus preguntas
  const fetchCognitiveTask = useCallback(async () => {
    if (!token || !researchId) return; 

    console.log('[ParticipantFlow] Obteniendo definición de Tarea Cognitiva...');
    setIsFetchingTask(true);
    setError(null);
    setSteps([]);
    setCurrentStepIndex(-1);
    setCognitiveAnswers({}); // Resetear respuestas

    try {
      const apiUrl = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
      // Endpoint que devuelve la lista de "formularios/pasos" generales
      const url = `${apiUrl}/research/${researchId}/forms`; 
      const response = await fetch(url, { /* ... headers con token ... */ 
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'}
      });

      if (!response.ok) throw new Error(`Error ${response.status} al cargar pasos generales.`);

      const result = await response.json();
      if (!result || !Array.isArray(result.data)) throw new Error('Formato de respuesta inesperado.');

      // Encontrar el item específico de COGNITIVE_TASK
      const cognitiveTaskDefinition = result.data.find((item: any) => item && item.sk === 'COGNITIVE_TASK');
      
      if (!cognitiveTaskDefinition) {
        throw new Error('No se encontró la definición de Tarea Cognitiva para esta investigación.');
      }
      console.log('[ParticipantFlow] Definición cruda de Cognitive Task encontrada:', cognitiveTaskDefinition);

      // Parsear el string 'questions'
      let questionsArray: CognitiveQuestion[] = [];
      if (typeof cognitiveTaskDefinition.questions === 'string') {
          try {
              questionsArray = JSON.parse(cognitiveTaskDefinition.questions);
              if (!Array.isArray(questionsArray)) throw new Error('El campo questions parseado no es un array.');
          } catch (e) {
              console.error('[ParticipantFlow] Error parseando questions de Cognitive Task:', e);
              throw new Error('Error al procesar las preguntas de la Tarea Cognitiva.');
          }
      } else if (Array.isArray(cognitiveTaskDefinition.questions)){
          // Si ya viene como array (menos probable según el log)
          questionsArray = cognitiveTaskDefinition.questions;
      } else {
           throw new Error('El campo questions falta o tiene formato incorrecto en la definición de Cognitive Task.');
      }
      
      // Transformar el array de preguntas en FlowSteps
      let flowSteps: CognitiveFlowStep[] = questionsArray.map((question, index) => ({
          id: question.id, 
          sk: question.type, 
          order: index,     
          config: question 
      }));
      
      // --- FILTRAR preguntas que no tienen título NI descripción --- 
      const nonEmptyFlowSteps = flowSteps.filter(step => 
          (step.config.title && step.config.title.trim() !== '') || 
          (step.config.description && step.config.description.trim() !== '')
      );
      
      console.log('[ParticipantFlow] Preguntas filtradas (no vacías):', nonEmptyFlowSteps);

      if (nonEmptyFlowSteps.length === 0) {
        setError('La Tarea Cognitiva no tiene preguntas con contenido definido.'); // Mensaje actualizado
      } else {
        setSteps(nonEmptyFlowSteps); // Guardar solo las preguntas no vacías
        setCurrentStepIndex(0); 
      }

    } catch (err: any) {
      console.error('[ParticipantFlow] Error en fetchCognitiveTask:', err);
      // ... (manejo de error de sesión y otros) ...
       if (err.message.includes('401') || err.message.includes('403')) {
            setParticipant(null); setToken(null); localStorage.removeItem('participantToken'); localStorage.removeItem('participantData');
            setError('Tu sesión ha expirado.');
       } else {
            setError(`Error al cargar Tarea Cognitiva: ${err.message || 'Error desconocido'}.`);
       }
      setSteps([]);
      setCurrentStepIndex(-1);
    } finally {
      setIsFetchingTask(false);
    }
  }, [researchId, token]);

  // 2. Llamado por WelcomeScreen para iniciar la Tarea Cognitiva
  const handleWelcomeStart = useCallback(() => {
    console.log('[ParticipantFlow] WelcomeScreen iniciado. Obteniendo Tarea Cognitiva...');
    fetchCognitiveTask(); // Llama a la función que obtiene y procesa las preguntas
  }, [fetchCognitiveTask]);

  // 3. Callback para actualizar la respuesta de una pregunta
   const handleAnswerChange = useCallback((questionId: string, answer: any) => {
     setCognitiveAnswers(prevAnswers => ({
       ...prevAnswers,
       [questionId]: answer
     }));
     // Aquí podríamos añadir validación si fuera necesario
   }, []);

  // 4. Avanzar a la SIGUIENTE PREGUNTA
  const goToNextStep = useCallback(() => { 
    const nextIndex = currentStepIndex + 1;
    console.log(`[ParticipantFlow] Avanzando de pregunta ${currentStepIndex + 1} a ${nextIndex + 1}`);
    
    if (nextIndex < steps.length) {
      setCurrentStepIndex(nextIndex);
    } else {
      console.log('[ParticipantFlow] Tarea Cognitiva completada! Respuestas:', cognitiveAnswers);
      // TODO: Enviar respuestas `cognitiveAnswers` al backend?
      setError('Has completado la tarea. ¡Gracias!'); // Mensaje final temporal
      // Podríamos ir a un ThankYouScreen genérico o terminar aquí
    }
  }, [currentStepIndex, steps, cognitiveAnswers]);

  // --- Lógica de Renderizado (Ahora basada en tipos de Pregunta Cognitiva) --- 
  const renderContent = () => {
     // ... (Lógica inicial: carga sesión, login, WelcomeScreen) ...
      if (isLoadingSession) return <div>Cargando sesión...</div>;
      if (!researchId) return <div className="...">Error: Falta ID...</div>;
      if (!participant || !token) { return <ParticipantLogin onLogin={handleLoginSuccess} researchId={researchId} />; }
      if (currentStepIndex === -1 && !isFetchingTask) { return <WelcomeScreen researchId={researchId} onStart={handleWelcomeStart} onError={setError} />; }
      if (isFetchingTask) { return <div>Cargando Tarea Cognitiva...</div>; }
      if (error) { return <div className="...">Error: {error}</div>; }
      if (steps.length === 0 && currentStepIndex >= 0) { return <div>Tarea Cognitiva sin preguntas.</div>; }

    // Renderizar la PREGUNTA actual 
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
        const currentQuestionStep = steps[currentStepIndex]; 
        
        if (!currentQuestionStep || !currentQuestionStep.id || !currentQuestionStep.sk || !currentQuestionStep.config) {
             console.error('[ParticipantFlow] FlowStep de pregunta inválido:', {currentStepIndex, currentQuestionStep});
             setError('Error interno al cargar pregunta actual.');
             return <div className="...">Error interno...</div>;
        }

        console.log(`[ParticipantFlow] Renderizando Pregunta ${currentStepIndex + 1}/${steps.length}: Tipo ${currentQuestionStep.sk}`);
        
        // Separar la key de las demás props
        const { id: key, config, sk } = currentQuestionStep;
        const componentProps = {
            config: config, 
            value: cognitiveAnswers[key], // Usar la 'key' (que es el id) para obtener la respuesta
            onChange: handleAnswerChange, 
        };

        let QuestionComponent;
        // Switch basado en el TIPO DE PREGUNTA (usar 'sk' de la desestructuración)
        switch (sk) {
            case 'short_text': QuestionComponent = ShortTextView; break;
            case 'long_text': QuestionComponent = LongTextView; break;
            case 'single_choice': QuestionComponent = SingleChoiceView; break;
            case 'multiple_choice': QuestionComponent = MultipleChoiceView; break;
            case 'linear_scale': QuestionComponent = LikertScaleView; break;
            case 'ranking': QuestionComponent = RankingView; break;
            case 'navigation_flow': QuestionComponent = NavigationFlowView; break;
            case 'preference_test': QuestionComponent = PreferenceTestView; break;
            default: 
                 console.warn('[ParticipantFlow] Tipo de pregunta cognitiva no soportado:', sk);
                 QuestionComponent = () => <div>Pregunta no soportada ({sk})</div>; // Placeholder en línea
        }
        
        // --- Renderizado del Paso (Pregunta + Botón) --- 
        return (
            <div className="p-4 md:p-6 border rounded shadow-md w-full max-w-2xl flex flex-col space-y-6 bg-white">
                {/* Renderizar el componente de la pregunta actual, pasando key directamente */}
                <QuestionComponent key={key} {...componentProps} />

                {/* Botón para continuar a la siguiente pregunta */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                    <button 
                        onClick={goToNextStep} 
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Continuar {/* O Siguiente */}
                    </button>
                </div>
            </div>
        );
    } 
    
    // ... (Fallback) ...
     return <div>Error inesperado.</div>;
  };

 return (
     <div className="participant-flow-container w-full h-screen flex flex-col items-center justify-center">
       {/* Añadir un botón temporal para ver el estado (DEBUG) */}
       {/* <pre className="absolute top-0 left-0 text-xs bg-gray-100 p-1 opacity-75">{JSON.stringify({idx: currentStepIndex, steps: steps.length, answers: Object.keys(cognitiveAnswers).length}, null, 2)}</pre> */}
       {renderContent()}
     </div>
   );
 };

 export default ParticipantFlow; 