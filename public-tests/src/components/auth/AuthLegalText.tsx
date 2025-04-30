import React from 'react';

interface AuthLegalTextProps {
    termsUrl?: string;
    privacyUrl?: string;
}

export const AuthLegalText: React.FC<AuthLegalTextProps> = ({ termsUrl = "#", privacyUrl = "#" }) => {
    return (
        <p className="mt-6 text-center text-sm text-neutral-600">
          Al continuar, aceptas nuestros{' '}
          <a href={termsUrl} className="text-neutral-900 hover:underline">
            Términos y Condiciones
          </a>
          {' '}y{' '}
          <a href={privacyUrl} className="text-neutral-900 hover:underline">
            Política de Privacidad
          </a>
        </p>
    );
}; 