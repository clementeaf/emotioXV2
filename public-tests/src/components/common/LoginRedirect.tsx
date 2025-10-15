import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTestStore } from '../../stores/useTestStore';
import { useParticipantStore } from '../../stores/useParticipantStore';
import { usePreviewModeStore } from '../../stores/usePreviewModeStore';

const LoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { setParticipant } = useTestStore();
  
  // 🎯 PREVENIR BUCLES INFINITOS - MULTIPLE PROTECTIONS
  const [hasProcessed, setHasProcessed] = useState(false);
  const processedRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  
  // 🎯 MEJORAR FUNCIÓN DE NAVEGACIÓN - PREVENIR CONDICIÓN DE CARRERA
  const handleNavigation = useCallback(() => {
    // 🔒 MÚPLTIPLES PROTECCIONES CONTRA BUCLES INFINITOS
    if (hasProcessed || isProcessingRef.current) {
      console.log('[LoginRedirect] Ya procesado o en proceso, saltando...');
      return;
    }
    
    const pathResearchId = params.researchId;
    const pathParticipantId = params.participantId;
    const urlParams = new URLSearchParams(location.search);
    const queryResearchId = urlParams.get('researchId');
    const queryParticipantId = urlParams.get('participantId');
    const queryUserId = urlParams.get('userId');
    const researchId = pathResearchId || queryResearchId;
    const participantId = pathParticipantId || queryParticipantId || queryUserId;
    
    console.log('[LoginRedirect] Procesando navegación:', {
      pathResearchId,
      pathParticipantId,
      queryResearchId,
      queryParticipantId,
      queryUserId,
      researchId,
      participantId,
      currentPath: location.pathname
    });
    
    // 🎯 CREAR CLAVE ÚNICA PARA EVITAR REPROCESAMIENTO
    const processKey = `${researchId}-${participantId || 'preview'}`;
    
    // Si ya procesamos esta combinación, salir
    if (processedRef.current === processKey) {
      console.log('[LoginRedirect] Ya procesado esta combinación:', processKey);
      return;
    }
    
    // 🔒 MARCAR COMO EN PROCESAMIENTO
    isProcessingRef.current = true;
    
    const { setParticipantId } = useParticipantStore.getState();
    const { setPreviewMode } = usePreviewModeStore.getState();

    if (!researchId) {
      console.log('[LoginRedirect] No hay researchId, redirigiendo a error');
      isProcessingRef.current = false;
      navigate('/error-no-research-id');
      return;
    }

    // 🔒 MARCAR COMO PROCESADO ANTES DE HACER CAMBIOS
    setHasProcessed(true);
    processedRef.current = processKey;

    console.log('[LoginRedirect] Configurando participante:', { researchId, participantId });

    if (participantId) {
      setPreviewMode(false);
      setParticipantId(participantId);

      const participantName = `Participante ${participantId.slice(-6).toUpperCase()}`;
      const participantEmail = `${participantId.slice(-8)}@participant.study`;

      setParticipant(
        participantId,
        participantName,
        participantEmail,
        researchId
      );

      console.log('[LoginRedirect] Navegando a test con participante:', participantId);
      navigate(`/test?researchId=${researchId}&participantId=${participantId}`);
    } else {
      setPreviewMode(true);

      const previewParticipantId = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setParticipantId(previewParticipantId);

      const participantName = `Preview User`;
      const participantEmail = `preview@test.local`;

      setParticipant(
        previewParticipantId,
        participantName,
        participantEmail,
        researchId
      );

      console.log('[LoginRedirect] Navegando a test en modo preview');
      navigate(`/test?researchId=${researchId}`);
    }
    
    // 🏁 FINALIZAR PROCESAMIENTO
    isProcessingRef.current = false;
  }, [params.researchId, params.participantId, location.search, navigate, setParticipant, hasProcessed]);

  useEffect(() => {
    // 🎯 EJECUTAR LÓGICA DE NAVEGACIÓN SOLO UNA VEZ
    handleNavigation();
  }, [handleNavigation]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Iniciando participación...
        </h2>
        <p className="text-gray-600">
          Configurando el test para el participante
        </p>
      </div>
    </div>
  );
};

export default LoginRedirect;