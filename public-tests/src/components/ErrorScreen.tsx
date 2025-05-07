import React from 'react';

interface ErrorScreenProps {
  message: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ message }) => {
  return (
    <div className="error-screen" style={{
      padding: '2rem',
      backgroundColor: '#ffebee',
      borderRadius: '8px',
      border: '1px solid #ef5350',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#d32f2f' }}>Error</h2>
      <p>{message}</p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: '#d32f2f',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Reintentar
      </button>
    </div>
  );
};

export default ErrorScreen; 