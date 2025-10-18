import { useNavigate } from 'react-router-dom';
import { useLogin } from './auth/useAuth';

export const useLoginHandler = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleLogin = async (email: string, password: string) => {

    try {
      const data = await loginMutation.mutateAsync({ email, password });

      if (data.success && data.data) {
        const { user: userData, token: userToken } = data.data;
        if (userData && userToken) {
          localStorage.setItem('token', userToken);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('auth_type', 'local');

          navigate('/dashboard', { replace: true });
        } else {
          console.error('[LOGIN] Faltan datos:', { hasUser: !!userData, hasToken: !!userToken });
          throw new Error('Datos de respuesta incompletos');
        }
      } else {
        console.error('[LOGIN] Respuesta no exitosa:', data);
        throw new Error('Respuesta de login inválida');
      }
    } catch (error) {
      console.error('[LOGIN] Error capturado:', error);
      throw error;
    }
  };

  return {
    handleLogin,
    isLoading: loginMutation.isPending,
    error: loginMutation.error
  };
};
