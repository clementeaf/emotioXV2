import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// Importar el componente de login
import { ParticipantLogin } from '../components/auth/ParticipantLogin'; 
// Importar la interfaz COMPARTIDA de Participant
import { Participant } from '../../../shared/interfaces/participant';
import { api, APIStatus } from '../lib/api'; // Importar api y APIStatus

// Interfaces placeholder (a definir mejor después)
/* Eliminar interfaz local
interface Participant {
  id: string;
  name: string;
  email: string;
}
*/

interface Step {
  id: string;
  type: string; // 'welcome', 'smartVoc', etc.
  config?: any;
}

const ParticipantFlow: React.FC = () => {
  const { researchId } = useParams<{ researchId: string }>();
  // Usar la interfaz importada para el estado
  const [participant, setParticipant] = useState<Participant | null>(null); 
  const [token, setToken] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (researchId) {
      console.log(`[ParticipantFlow] Iniciando flujo para researchId: ${researchId}`);
      // Intentar recuperar token y participante de localStorage al inicio
      // (por si el usuario recarga la página a mitad del flujo)
      const storedToken = localStorage.getItem('participantToken');
      const storedParticipant = localStorage.getItem('participantData'); // Asumimos que se guarda como string JSON
      
      if (storedToken && storedParticipant) {
          try {
              const parsedParticipant: Participant = JSON.parse(storedParticipant); // Tipar aquí también
              // Validar que el participante guardado corresponde a esta investigación (opcional pero recomendado)
              // if (parsedParticipant.currentResearchId === researchId) { // Necesitaría añadir currentResearchId al guardar
                 console.log('[ParticipantFlow] Sesión de participante encontrada en localStorage');
                 setParticipant(parsedParticipant);
                 setToken(storedToken);
              // }
          } catch (e) {
              console.error('[ParticipantFlow] Error parseando participante de localStorage', e);
              localStorage.removeItem('participantToken');
              localStorage.removeItem('participantData');
          }
      }
      setIsLoading(false); 
    } else {
      setError('No se proporcionó ID de investigación en la URL.');
      setIsLoading(false);
    }
  }, [researchId]);

  // La firma de la función ahora usa la interfaz importada automáticamente
  const handleLoginSuccess = (loggedInParticipant: Participant) => {
    console.log('[ParticipantFlow] Login exitoso:', loggedInParticipant);
    // Leer token de localStorage (ya guardado por ParticipantLogin)
    const storedToken = localStorage.getItem('participantToken');
    if (storedToken) {
      setParticipant(loggedInParticipant);
      setToken(storedToken);
      // Guardar también los datos del participante en localStorage
      // (añadiendo researchId podría ser útil para validación al recargar)
      localStorage.setItem('participantData', JSON.stringify({...loggedInParticipant, currentResearchId: researchId }));
    } else {
      console.error('[ParticipantFlow] Error crítico: Login exitoso pero no se encontró token en localStorage.');
      setError('Ocurrió un error al iniciar sesión. Por favor, refresca la página.');
    }
  };

  // Función para obtener los pasos del backend una vez que se tiene el token
  const fetchSteps = async () => {
    // Asegurarse de tener token y researchId antes de llamar
    if (!token || !researchId) {
      console.warn('[ParticipantFlow] Intento de fetchSteps sin token o researchId');
      return; 
    }
    setIsLoading(true); 
    setError(null); // Limpiar errores previos antes de intentar
    console.log('[ParticipantFlow] Obteniendo pasos del backend...');
    try {
      // Llamada real a la API usando el ApiClient
      const response = await api.getResearchFlow(researchId); 

      if (response.apiStatus === APIStatus.SUCCESS && response.data) {
          console.log('[ParticipantFlow] Pasos recibidos:', response.data);
          // Validar si la respuesta es un array (por si acaso)
          if (Array.isArray(response.data)) {
            setSteps(response.data);
            setCurrentStepIndex(0); 
          } else {
            console.error('[ParticipantFlow] La respuesta de getResearchFlow no fue un array:', response.data);
            setError('Error: Formato de datos inesperado del servidor.');
            setSteps([]); // Establecer steps vacío para evitar errores de renderizado
          }
      } else {
          console.error('[ParticipantFlow] Error obteniendo pasos:', response.message, response.apiStatus);
          setError(`Error al cargar la secuencia: ${response.message || 'Error desconocido'}. Intenta refrescar.`);
          if (response.apiStatus === APIStatus.TOKEN_EXPIRED || response.apiStatus === APIStatus.UNAUTHORIZED) {
              // Limpiar estado local para forzar re-login
              console.log('[ParticipantFlow] Token inválido o expirado, limpiando sesión...');
              setParticipant(null);
              setToken(null);
              localStorage.removeItem('participantToken');
              localStorage.removeItem('participantData');
          } else if (response.apiStatus === APIStatus.NOT_FOUND) {
            setError('Error: La secuencia de investigación no se encontró. Verifica el ID.');
          }
          setSteps([]); // Limpiar pasos si hubo error
      }
    } catch (err: any) { 
        console.error('[ParticipantFlow] Error inesperado en fetchSteps:', err);
        setError(`Error inesperado al cargar la secuencia: ${err.message}.`);
        setSteps([]);
    } finally {
        setIsLoading(false);
    }
  };
  
  // useEffect para llamar a fetchSteps cuando cambie el token
  useEffect(() => {
      if (token && researchId) { // Asegurarse de tener ambos
          fetchSteps();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, researchId]); // Depender también de researchId
  
  // Función para avanzar al siguiente paso
  const goToNextStep = () => {
      console.log('[ParticipantFlow] Avanzando al siguiente paso desde el índice:', currentStepIndex);
      if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
      } else {
          console.log('[ParticipantFlow] Flujo completado!');
          // TODO: Quizás mostrar un mensaje final aquí mismo o navegar a una ruta /complete
      }
  };

  // Lógica de renderizado
  const renderCurrentStep = () => {
    if (isLoading && !participant) { // Mostrar carga solo si aún no hay datos de sesión
      return <div>Cargando...</div>;
    }
    if (error) {
      return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error: {error}</div>;
    }
    // Si no hay participante/token Y ya no estamos cargando, mostrar Login
    if (!participant || !token) {
      if (!researchId) { // Doble chequeo por si acaso
        return <div className="p-4 text-red-600">Error: Falta ID de investigación.</div>;
      }
      // Renderizar el componente ParticipantLogin real
      return <ParticipantLogin onLogin={handleLoginSuccess} researchId={researchId} />;
    }
    // Si hay participante/token pero aún no hay pasos (o está cargando fetchSteps)
    if (isLoading || steps.length === 0 && !error) { // Añadir !error para no mostrar ambos mensajes
      return <div>Cargando pasos de la investigación...</div>; 
    }

    // Si hubo error cargando pasos pero no es error de autenticación, mostrar error
    if (error && (participant && token)) { 
      return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error: {error}</div>;
    }
    
    // Si no hay pasos y no hubo error (ej: investigación vacía), mostrar mensaje
    if(steps.length === 0 && !isLoading && !error && participant && token) {
        return <div>Esta investigación no tiene pasos definidos.</div>;
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
        console.error('[ParticipantFlow] Error: Índice de paso inválido', currentStepIndex, steps);
        return <div>Error interno al cargar el paso actual.</div>
    }
    
    console.log(`[ParticipantFlow] Renderizando paso ${currentStepIndex + 1}/${steps.length}: ${currentStep.type} (ID: ${currentStep.id})`);
    
    // TODO: Reemplazar placeholders con componentes reales
    switch (currentStep.type) {
      case 'welcomeScreen':
        // import WelcomeScreen from '../components/research/WelcomeScreen/WelcomeScreen';
        // return <WelcomeScreen stepData={currentStep.config} researchId={researchId} onStart={goToNextStep} onError={(e) => setError(e.message)} />;
        return <div>Paso: Welcome Screen (ID: {currentStep.id}) <button onClick={goToNextStep}>Siguiente</button></div>;
      case 'smartVoc':
         // import { SmartVOCRouter } from '../components/smartVoc/SmartVOCRouter'; // Asumiendo un router
         // return <SmartVOCRouter stepData={currentStep.config} researchId={researchId} onComplete={goToNextStep} />;
         return <div>Paso: SmartVOC (ID: {currentStep.id}) <button onClick={goToNextStep}>Siguiente</button></div>;
      case 'cognitiveTask':
         // import { CognitiveTaskView } from '../components/cognitiveTask';
         // return <CognitiveTaskView stepData={currentStep.config} researchId={researchId} onComplete={goToNextStep} />;
         return <div>Paso: Cognitive Task (ID: {currentStep.id}) <button onClick={goToNextStep}>Siguiente</button></div>;
      case 'thankYouScreen':
         // import ThankYouScreen from '../components/research/ThankYouScreen/ThankYouScreen';
         // return <ThankYouScreen stepData={currentStep.config} researchId={researchId} />; // No llama a goToNextStep
         return <div>Paso: Thank You Screen (ID: {currentStep.id}) <button>Finalizar</button></div>;
      default:
        console.warn('[ParticipantFlow] Tipo de paso desconocido:', currentStep.type);
        return <div>Paso desconocido: {currentStep.type} <button onClick={goToNextStep}>Forzar Siguiente</button></div>;
    }
  };

  return (
    <div className="participant-flow-container w-full h-screen flex flex-col items-center justify-center">
      {/* Renderizar el paso actual */} 
      {renderCurrentStep()}
    </div>
  );
};

export default ParticipantFlow; 