import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTestStore } from '../../stores/useTestStore';

const LoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { setParticipant } = useTestStore();

  useEffect(() => {
    // 🎯 INTENTO 1: Obtener parámetros desde la URL path (/{researchId}/{participantId})
    const pathResearchId = params.researchId;
    const pathParticipantId = params.participantId;

    // 🎯 INTENTO 2: Obtener parámetros desde query string (?researchId=X&userId=Y)
    const urlParams = new URLSearchParams(location.search);
    const queryResearchId = urlParams.get('researchId');
    const queryUserId = urlParams.get('userId');

    // 🎯 PRIORIDAD: Path params > Query params
    const researchId = pathResearchId || queryResearchId;
    const participantId = pathParticipantId || queryUserId;


    if (researchId && participantId) {
      // 🎯 AMBOS PARÁMETROS ESTÁN PRESENTES - PROCEDER DIRECTAMENTE
      // Guardar en localStorage para persistencia
      localStorage.setItem('researchId', researchId);
      localStorage.setItem('userId', participantId);

      // Configurar participante con participantId
      // Generar un nombre más descriptivo basado en el ID
      const participantName = `Participante ${participantId.slice(-6).toUpperCase()}`;
      const participantEmail = `${participantId.slice(-8)}@participant.study`;
      
      setParticipant(
        participantId,
        participantName,
        participantEmail,
        researchId
      );


      // Redirigir al test directamente
      navigate('/test');
    } else {
      // Faltan parámetros - redirigir a error
      navigate('/error-no-research-id');
    }
  }, [location, navigate, setParticipant, params]);

  // Loading state mientras redirige
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