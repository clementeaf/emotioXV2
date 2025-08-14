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
    const userId = params.get('userId');

    if (researchId && userId) {
      // 🎯 AMBOS PARÁMETROS ESTÁN PRESENTES - PROCEDER DIRECTAMENTE
      // Guardar en localStorage para persistencia
      localStorage.setItem('researchId', researchId);
      localStorage.setItem('userId', userId);

      // Configurar participante con userId
      setParticipant(
        userId,
        `Participante ${userId.slice(-6)}`, // Nombre basado en últimos 6 caracteres del ID
        '', // Email vacío por ahora
        researchId
      );

      // Redirigir al test directamente
      navigate('/test');
    } else {
      // Faltan parámetros - redirigir a error
      navigate('/error-no-research-id');
    }
  }, [location, navigate, setParticipant]);

  // Loading state mientras redirige
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Cargando investigación...
        </h2>
        <p className="text-gray-600">
          Validando parámetros y configurando el test
        </p>
      </div>
    </div>
  );
};

export default LoginRedirect;