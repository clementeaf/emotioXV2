import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const researchId = params.get('researchId');

    if (researchId) {
      console.log('[LoginRedirect] ResearchId encontrado:', researchId);
    } else {
      navigate('/error-no-research-id');
    }
  }, [location, navigate]);

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
