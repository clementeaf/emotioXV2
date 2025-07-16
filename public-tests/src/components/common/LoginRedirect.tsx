import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTestStore } from '../../stores/useTestStore';

const LoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setParticipant } = useTestStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const researchId = params.get('researchId');
    const participantId = params.get('participantId') || 'test-participant-' + Date.now();

    if (researchId) {

      setParticipant(
        participantId,
        'Test Participant',
        'test@example.com',
        researchId
      );
    } else {
      navigate('/error-no-research-id');
    }
  }, [location, navigate, setParticipant]);

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
