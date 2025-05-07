import React, { useState } from 'react';

interface LoginFormProps {
  onLoginSuccess: (participant: any) => void;
  researchId?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, researchId }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor, introduce tu email');
      return;
    }
    
    if (!researchId) {
      setError('ID de investigación no disponible');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulación de llamada a API
      console.log(`[LoginForm] Intentando login con email ${email} para la investigación ${researchId}`);
      
      // Esperar un segundo para simular la llamada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generar ID de participante basado en email
      const participantId = `participant_${btoa(email).replace(/[=+/]/g, '')}`;
      
      // Simular token
      const token = `token_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('participantToken', token);
      
      // Crear objeto de participante
      const participant = {
        id: participantId,
        email,
        name: email.split('@')[0]
      };
      
      // Llamar al callback de éxito
      onLoginSuccess(participant);
      
    } catch (err: any) {
      console.error('[LoginForm] Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container" style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Ingresa a la investigación</h2>
      
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="email" style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
      
      <p style={{ 
        fontSize: '0.9rem', 
        color: '#666', 
        marginTop: '1.5rem',
        textAlign: 'center'
      }}>
        Ingresa tu email para participar en esta investigación.
      </p>
    </div>
  );
};

export default LoginForm; 