import React from 'react';
import { AuthLegalTextProps } from '../../types/flow.types';

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