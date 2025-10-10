import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTestStore } from '../../stores/useTestStore';
import { useParticipantStore } from '../../stores/useParticipantStore';
import { usePreviewModeStore } from '../../stores/usePreviewModeStore';

const LoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { setParticipant } = useTestStore();

  // 🎯 ESTABILIZAR LA FUNCIÓN PARA EVITAR BUCLES INFINITOS
  const stableSetParticipant = useCallback(setParticipant, [setParticipant]);

  useEffect(() => {
    const pathResearchId = params.researchId;
    const pathParticipantId = params.participantId;
    const urlParams = new URLSearchParams(location.search);
    const queryResearchId = urlParams.get('researchId');
    const queryParticipantId = urlParams.get('participantId');
    const queryUserId = urlParams.get('userId');
    const researchId = pathResearchId || queryResearchId;
    const participantId = pathParticipantId || queryParticipantId || queryUserId;

    const { setParticipantId } = useParticipantStore.getState();
    const { setPreviewMode } = usePreviewModeStore.getState();

    if (!researchId) {
      console.error('[LoginRedirect] ❌ No researchId provided');
      navigate('/error-no-research-id');
      return;
    }

    if (participantId) {
      setPreviewMode(false);
      setParticipantId(participantId);

      const participantName = `Participante ${participantId.slice(-6).toUpperCase()}`;
      const participantEmail = `${participantId.slice(-8)}@participant.study`;

      stableSetParticipant(
        participantId,
        participantName,
        participantEmail,
        researchId
      );

      navigate(`/test?researchId=${researchId}&participantId=${participantId}`);
    } else {
      setPreviewMode(true);

      const previewParticipantId = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setParticipantId(previewParticipantId);

      const participantName = `Preview User`;
      const participantEmail = `preview@test.local`;

      stableSetParticipant(
        previewParticipantId,
        participantName,
        participantEmail,
        researchId
      );

      navigate(`/test?researchId=${researchId}`);
    }
  }, [location, navigate, stableSetParticipant, params]);

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