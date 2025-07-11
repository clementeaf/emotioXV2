"use strict";
// <<< Eliminar la re-exportación >>>
// export type { WelcomeScreenData } from '@/services/welcomeScreenService';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_WELCOME_SCREEN_CONFIG = void 0;
// <<< Usar el alias importado abajo >>>
exports.DEFAULT_WELCOME_SCREEN_CONFIG = {
    isEnabled: false,
    title: 'Bienvenido/a a la Investigación',
    message: 'Gracias por tu interés en participar. Por favor, lee la información y haz clic en \'Continuar\' cuando estés listo/a.',
    startButtonText: 'Continuar',
    backgroundColor: '#FFFFFF',
    textColor: '#333333',
    theme: 'light',
    // logoUrl y backgroundImageUrl se dejan vacíos por defecto
};
