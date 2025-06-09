import React from 'react';
import { WelcomeScreenProps } from '../types/common.types';

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ title, message, onContinue }) => {
  return (
    <div className="welcome-screen" style={{
      padding: '2rem',
      backgroundColor: '#e8f5e9',
      borderRadius: '8px',
      border: '1px solid #81c784',
      textAlign: 'center',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#2e7d32' }}>{title}</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{message}</p>
      <button 
        onClick={onContinue}
        style={{
          backgroundColor: '#2e7d32',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}
      >
        Comenzar
      </button>
    </div>
  );
};

export default WelcomeScreen; 