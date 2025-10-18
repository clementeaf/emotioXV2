import React, { useState } from 'react';
import { useLoginHandler } from '../hooks/useLoginHandler';
import { Card } from '../components/layout';
import { Input, Alert, Spinner } from '../components/commons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { handleLogin, isLoading } = useLoginHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await handleLogin(email, password);
    } catch (error) {
      console.error('Login error:', error);
      setError('Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="w-full max-w-md">
        <Card className="p-8" padding="none">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenido a EmotioX
            </h1>
            <p className="text-gray-600">
              Inicia sesión para acceder a tu dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert type="error">{error}</Alert>}

            <div className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
              
              <Input
                id="password"
                name="password"
                type="password"
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Al iniciar sesión, aceptas nuestros términos de servicio
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
