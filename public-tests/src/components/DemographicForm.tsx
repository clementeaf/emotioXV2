import React, { useState, useEffect } from 'react';

interface DemographicFormProps {
  config: any;
  onSubmit: (data: any) => void;
  isAnswered?: boolean;
}

interface DemographicData {
  gender: string;
  age: string;
  education: string;
  occupation: string;
  [key: string]: string;
}

const DemographicForm: React.FC<DemographicFormProps> = ({ config, onSubmit, isAnswered = false }) => {
  const [formData, setFormData] = useState<DemographicData>({
    gender: '',
    age: '',
    education: '',
    occupation: ''
  });

  // Cargar datos guardados si ya se respondió
  useEffect(() => {
    if (isAnswered && config?.savedResponses) {
      setFormData(config.savedResponses);
    }
  }, [isAnswered, config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="demographic-form" style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '1.5rem' }}>{config?.title || 'Información Demográfica'}</h2>
      
      {config?.description && (
        <p style={{ marginBottom: '1.5rem' }}>{config.description}</p>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="gender" style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            Género
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={isAnswered}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          >
            <option value="">Selecciona una opción</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
            <option value="prefer_not_to_say">Prefiero no decirlo</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="age" style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            Edad
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min="18"
            max="100"
            value={formData.age}
            onChange={handleChange}
            disabled={isAnswered}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="education" style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            Nivel de educación
          </label>
          <select
            id="education"
            name="education"
            value={formData.education}
            onChange={handleChange}
            disabled={isAnswered}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          >
            <option value="">Selecciona una opción</option>
            <option value="primary">Primaria</option>
            <option value="secondary">Secundaria</option>
            <option value="high_school">Bachillerato</option>
            <option value="technical">Formación técnica</option>
            <option value="undergraduate">Grado universitario</option>
            <option value="graduate">Posgrado</option>
            <option value="doctorate">Doctorado</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="occupation" style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            Ocupación
          </label>
          <input
            id="occupation"
            name="occupation"
            type="text"
            value={formData.occupation}
            onChange={handleChange}
            disabled={isAnswered}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          />
        </div>
        
        {!isAnswered && (
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Continuar
          </button>
        )}
        
        {isAnswered && (
          <div style={{
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            padding: '0.75rem',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            Información demográfica guardada
          </div>
        )}
      </form>
    </div>
  );
};

export default DemographicForm; 