import { useState } from 'react';

interface PasswordResetTaskProps {
  onContinue: () => void;
}

// Componente para la tarea de recuperación de contraseña
const PasswordResetTask = ({ onContinue }: PasswordResetTaskProps) => {
  const [email, setEmail] = useState<string>('');
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Validación básica de email cuando el usuario escribe
    setIsEmailValid(true);
  };
  
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  const handleContinue = () => {
    // Validamos el email antes de continuar
    if (email.trim() === '' || !validateEmail(email)) {
      setIsEmailValid(false);
      return;
    }
    
    console.log('Email para recuperación:', email);
    onContinue();
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          ¿Cómo resolverías el problema?
        </h2>
        
        <p className="text-neutral-600 mb-6 text-center">
          No problem. Just let us know your email address and we'll email you a password reset link that will allow 
          you to choose a new one. You a password reset link.
        </p>
        
        <div className="w-full max-w-sm mb-6">
          <input
            type="email"
            placeholder="Email@dominio.com"
            value={email}
            onChange={handleEmailChange}
            className={`w-full p-2.5 border ${
              isEmailValid ? 'border-neutral-300' : 'border-red-500'
            } rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600`}
          />
          {!isEmailValid && (
            <p className="text-red-500 text-xs mt-1">
              Por favor introduce un email válido
            </p>
          )}
        </div>
        
        <button
          onClick={handleContinue}
          className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-10 rounded w-32 transition-colors shadow-sm"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default PasswordResetTask; 