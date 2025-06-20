import React, { useEffect } from 'react';
import { MappedStepComponentProps } from '../types/flow.types';

const ThankYouScreen: React.FC<MappedStepComponentProps> = ({ stepConfig, onStepComplete }) => {
  // Desestructurar la configuración con valores por defecto
  const {
    title = '¡Muchas gracias!',
    message = 'Hemos recibido tus respuestas.',
    redirectUrl
  } = (stepConfig as { title?: string; message?: string; redirectUrl?: string }) || {};

  useEffect(() => {
    if (redirectUrl) {
      console.log(`[ThankYouScreen] Redirigiendo a: ${redirectUrl} en 5 segundos...`);
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 5000); // 5 segundos de espera

      // Limpiar el temporizador si el componente se desmonta
      return () => clearTimeout(timer);
    }
  }, [redirectUrl]);

  return (
    <div className="thank-you-screen" style={{
      padding: '2rem',
      backgroundColor: '#e3f2fd',
      borderRadius: '8px',
      border: '1px solid #64b5f6',
      textAlign: 'center',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#1565c0' }}>{title}</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{message}</p>
      <div className="check-mark" style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#4caf50',
        margin: '0 auto',
        position: 'relative'
      }}>
        <div style={{
          content: "''",
          display: 'inline-block',
          width: '20px',
          height: '40px',
          border: 'solid white',
          borderWidth: '0 8px 8px 0',
          transform: 'rotate(45deg)',
          position: 'absolute',
          top: '15px',
          left: '30px',
        }}></div>
      </div>
      {redirectUrl && (
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
          Serás redirigido en 5 segundos...
        </p>
      )}
    </div>
  );
};

export default ThankYouScreen;
