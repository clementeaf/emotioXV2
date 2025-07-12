"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_WELCOME_SCREEN_CONFIG = exports.DEFAULT_WELCOME_SCREEN_VALIDATION = void 0;
/**
 * Default validation rules for Welcome Screen
 */
exports.DEFAULT_WELCOME_SCREEN_VALIDATION = {
    title: {
        minLength: 3,
        maxLength: 100,
        required: true
    },
    message: {
        minLength: 10,
        maxLength: 1000,
        required: true
    },
    startButtonText: {
        minLength: 2,
        maxLength: 50,
        required: true
    }
};
/**
 * Default Welcome Screen configuration
 */
exports.DEFAULT_WELCOME_SCREEN_CONFIG = {
    isEnabled: true,
    title: '',
    message: '',
    startButtonText: 'Start Research',
    metadata: {
        version: '1.0.0'
    }
};
