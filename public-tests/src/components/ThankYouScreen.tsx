import React from 'react';

interface ThankYouScreenProps {
  message: string;
}

const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ message }) => {
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
      <h1 style={{ color: '#1565c0' }}>¡Muchas gracias!</h1>
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
          width: '40px',
          height: '20px',
          borderBottom: '8px solid white',
          borderRight: '8px solid white',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -70%) rotate(45deg)'
        }}></div>
      </div>
    </div>
  );
};

export default ThankYouScreen; 