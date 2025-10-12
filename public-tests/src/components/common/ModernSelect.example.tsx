import React, { useState } from 'react';
import { ModernSelect, SelectOption } from './ModernSelect';

// 🎯 EJEMPLOS DE USO DEL COMPONENTE MODERNSELECT

export const ModernSelectExamples = () => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Ejemplo 1: Países
  const countryOptions: SelectOption[] = [
    { value: 'mexico', label: 'México' },
    { value: 'colombia', label: 'Colombia' },
    { value: 'argentina', label: 'Argentina' },
    { value: 'chile', label: 'Chile' },
    { value: 'peru', label: 'Perú' },
    { value: 'other', label: 'Otro país', disabled: true }
  ];

  // Ejemplo 2: Edades (con opciones descalificantes)
  const ageOptions: SelectOption[] = [
    { value: '18-24', label: '18-24 años' },
    { value: '25-34', label: '25-34 años' },
    { value: '35-44', label: '35-44 años' },
    { value: '45-54', label: '45-54 años' },
    { value: '55-64', label: '55-64 años' },
    { value: '65+', label: '65+ años', className: 'text-red-500' } // Opción descalificante
  ];

  // Ejemplo 3: Género
  const genderOptions: SelectOption[] = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
    { value: 'non-binary', label: 'No binario' },
    { value: 'prefer-not-say', label: 'Prefiero no decir' }
  ];

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Ejemplos de ModernSelect
      </h1>

      {/* Ejemplo básico */}
      <div>
        <h2 className="text-lg font-semibold mb-4">1. Selector básico</h2>
        <ModernSelect
          options={countryOptions}
          value={selectedCountry}
          onChange={setSelectedCountry}
          placeholder="Selecciona tu país"
          label="País de residencia"
          required
        />
      </div>

      {/* Ejemplo con diferentes tamaños */}
      <div>
        <h2 className="text-lg font-semibold mb-4">2. Diferentes tamaños</h2>
        <div className="space-y-4">
          <ModernSelect
            options={ageOptions}
            value={selectedAge}
            onChange={setSelectedAge}
            placeholder="Selecciona tu edad"
            label="Edad (Pequeño)"
            size="sm"
          />
          <ModernSelect
            options={ageOptions}
            value={selectedAge}
            onChange={setSelectedAge}
            placeholder="Selecciona tu edad"
            label="Edad (Mediano - por defecto)"
            size="md"
          />
          <ModernSelect
            options={ageOptions}
            value={selectedAge}
            onChange={setSelectedAge}
            placeholder="Selecciona tu edad"
            label="Edad (Grande)"
            size="lg"
          />
        </div>
      </div>

      {/* Ejemplo con error */}
      <div>
        <h2 className="text-lg font-semibold mb-4">3. Con validación de error</h2>
        <ModernSelect
          options={genderOptions}
          value={selectedGender}
          onChange={setSelectedGender}
          placeholder="Selecciona tu género"
          label="Género"
          required
          error={!selectedGender ? 'Este campo es requerido' : ''}
        />
      </div>

      {/* Ejemplo deshabilitado */}
      <div>
        <h2 className="text-lg font-semibold mb-4">4. Selector deshabilitado</h2>
        <ModernSelect
          options={countryOptions}
          value=""
          onChange={() => {}}
          placeholder="Selector deshabilitado"
          label="Opción no disponible"
          disabled
        />
      </div>

      {/* Valores seleccionados */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Valores seleccionados:</h3>
        <ul className="text-sm text-gray-700">
          <li>País: {selectedCountry || 'Ninguno'}</li>
          <li>Edad: {selectedAge || 'Ninguna'}</li>
          <li>Género: {selectedGender || 'Ninguno'}</li>
        </ul>
      </div>
    </div>
  );
};

// 🎯 EJEMPLO DE IMPLEMENTACIÓN EN DEMOGRAPHICS
export const DemographicSelectExample = () => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const demographicQuestions = [
    {
      key: 'age',
      label: 'Edad',
      required: true,
      options: [
        { value: '18-24', label: '18-24 años' },
        { value: '25-34', label: '25-34 años' },
        { value: '35-44', label: '35-44 años' },
        { value: '45-54', label: '45-54 años' },
        { value: '55+', label: '55+ años' }
      ]
    },
    {
      key: 'gender',
      label: 'Género',
      required: true,
      options: [
        { value: 'male', label: 'Masculino' },
        { value: 'female', label: 'Femenino' },
        { value: 'other', label: 'Otro' }
      ]
    }
  ];

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Preguntas Demográficas</h2>
      
      <div className="space-y-6">
        {demographicQuestions.map(question => (
          <ModernSelect
            key={question.key}
            options={question.options}
            value={formData[question.key] || ''}
            onChange={(value) => handleSelectChange(question.key, value)}
            label={question.label}
            required={question.required}
            placeholder="Selecciona una opción"
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2">Datos del formulario:</h3>
        <pre className="text-sm text-gray-700">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
};