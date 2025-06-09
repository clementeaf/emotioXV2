import React from 'react';
import { ProgressBarProps } from '../types';

// Props extendidas para este componente específico
interface ExtendedProgressBarProps extends Omit<ProgressBarProps, 'currentStep' | 'totalSteps'> {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ExtendedProgressBarProps> = ({ current, total }) => {
  // Calcular porcentaje
  const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  
  return (
    <div className="progress-bar-container" style={{
      width: '100%',
      marginBottom: '1.5rem'
    }}>
      <div className="progress-info" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <span>Progreso</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="progress-track" style={{
        width: '100%',
        height: '10px',
        backgroundColor: '#e0e0e0',
        borderRadius: '5px',
        overflow: 'hidden'
      }}>
        <div className="progress-fill" style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: '#4caf50',
          borderRadius: '5px',
          transition: 'width 0.3s ease'
        }}></div>
      </div>
    </div>
  );
};

export default ProgressBar; 