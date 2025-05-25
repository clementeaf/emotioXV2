// Handler global para errores de autenticación y API
export function handleApiError(error: any) {
  if (
    error?.message?.includes('No autenticado') ||
    error?.statusCode === 401 ||
    error?.response?.status === 401
  ) {
    // Limpia el token y redirige al login
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return;
  }
  // Otros errores pueden manejarse aquí
  throw error;
} 