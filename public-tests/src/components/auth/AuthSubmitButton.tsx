import React from 'react';

interface AuthSubmitButtonProps {
  isLoading: boolean;
  loadingText?: string;
  text?: string;
  className?: string;
}

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
    isLoading,
    loadingText = 'Cargando...',
    text = 'Continuar',
    className = ''
}) => {
    const baseClasses = "w-full bg-[#121829] hover:bg-[#1e293e] text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <button
            type="submit"
            className={`${baseClasses} ${className}`}
            disabled={isLoading}
        >
            {isLoading ? loadingText : text}
        </button>
    );
};
