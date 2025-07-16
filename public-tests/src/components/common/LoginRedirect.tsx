import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ParticipantLogin from '../../pages/ParticipantLogin';
import { useTestStore } from '../../stores/useTestStore';

// Definir la interfaz Participant localmente
interface Participant {
  name: string;
  email: string;
}

const LoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setParticipant } = useTestStore();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const researchId = params.get('researchId');

    if (researchId) {
      // 🎯 MOSTRAR EL LOGIN REAL EN LUGAR DE CREDENCIALES AUTOMÁTICAS
      setShowLogin(true);
    } else {
      navigate('/error-no-research-id');
    }
  }, [location, navigate]);

  const handleLoginSuccess = (participant: Participant) => {
    const params = new URLSearchParams(location.search);
    const researchId = params.get('researchId');
    const participantId = (participant as any).id || 'real-participant-id';

    if (researchId) {
      // 🎯 GUARDAR researchId EN LOCALSTORAGE PARA PERSISTENCIA
      localStorage.setItem('researchId', researchId);

      setParticipant(
        participantId,
        participant.name,
        participant.email,
        researchId
      );
      // Redirigir a las preguntas después del login exitoso
      navigate('/test');
    }
  };

  if (showLogin) {
    const params = new URLSearchParams(location.search);
    const researchId = params.get('researchId') || '';

    return (
      <ParticipantLogin
        researchId={researchId}
        onLoginSuccess={handleLoginSuccess}
        onLogin={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Redirigiendo...
        </h2>
        <p className="text-gray-600">
          Cargando la investigación...
        </p>
      </div>
    </div>
  );
};

export default LoginRedirect;
