"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.register = exports.login = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const error_middleware_1 = require("../middlewares/error.middleware");
const response_middleware_1 = require("../middlewares/response.middleware");
const error_middleware_2 = require("../middlewares/error.middleware");
/**
 * Controlador para la autenticación
 */
class AuthController {
    /**
     * Maneja la ruta de login
     */
    async login(event) {
        try {
            // Validar que el cuerpo de la solicitud existe
            if (!event.body) {
                throw new error_middleware_1.ValidationError('Request body is required');
            }
            // Parsear el cuerpo de la solicitud
            const { email, password } = JSON.parse(event.body);
            // Validar campos requeridos
            if (!email || !password) {
                throw new error_middleware_1.ValidationError('Email and password are required');
            }
            // Autenticar usuario
            const result = await auth_service_1.authService.login(email, password);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(result, 'Login successful');
        }
        catch (error) {
            // Manejar errores específicos
            if (error.message === 'User not found' || error.message === 'Invalid credentials') {
                return (0, error_middleware_2.errorHandler)(new error_middleware_1.UnauthorizedError('Invalid email or password'));
            }
            // Manejar otros errores
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Maneja la ruta de registro
     */
    async register(event) {
        try {
            // Validar que el cuerpo de la solicitud existe
            if (!event.body) {
                throw new error_middleware_1.ValidationError('Request body is required');
            }
            // Parsear el cuerpo de la solicitud
            const { name, email, password } = JSON.parse(event.body);
            // Validar campos requeridos
            if (!name || !email || !password) {
                throw new error_middleware_1.ValidationError('Name, email and password are required');
            }
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new error_middleware_1.ValidationError('Invalid email format');
            }
            // Validar longitud de contraseña
            if (password.length < 6) {
                throw new error_middleware_1.ValidationError('Password must be at least 6 characters long');
            }
            // Registrar usuario
            const result = await auth_service_1.authService.register(name, email, password);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.createdResponse)(result, 'Registration successful');
        }
        catch (error) {
            // Manejar errores específicos
            if (error.message === 'User already exists') {
                return (0, error_middleware_2.errorHandler)(new error_middleware_1.ValidationError('Email already registered'));
            }
            // Manejar otros errores
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Maneja la ruta de logout
     */
    async logout(event) {
        try {
            // En una implementación JWT simple, el logout se maneja en el cliente
            // eliminando el token. Aquí podríamos implementar una lista negra de tokens
            // si fuera necesario.
            return (0, response_middleware_1.successResponse)({}, 'Logout successful');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
}
exports.AuthController = AuthController;
// Instancia del controlador para las funciones Lambda
const authController = new AuthController();
// Exportar funciones para serverless
const login = (event) => authController.login(event);
exports.login = login;
const register = (event) => authController.register(event);
exports.register = register;
const logout = (event) => authController.logout(event);
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map