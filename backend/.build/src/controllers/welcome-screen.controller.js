"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.save = exports.WelcomeScreenController = void 0;
const welcome_screen_service_1 = require("../services/welcome-screen.service");
const auth_1 = require("../utils/auth");
const response_1 = require("../utils/response");
/**
 * Controlador para el Welcome Screen
 */
class WelcomeScreenController {
    constructor() {
        this.welcomeScreenService = new welcome_screen_service_1.WelcomeScreenService();
    }
    /**
     * Guardar la configuración del Welcome Screen
     */
    async saveWelcomeScreen(event) {
        try {
            // Obtener el origen para los headers CORS
            const origin = (0, response_1.getOriginFromEvent)(event);
            // Autenticar al usuario y obtener su ID
            const userId = (0, auth_1.requireAuth)(event);
            // Obtener los datos del cuerpo de la petición
            const requestBody = JSON.parse(event.body || '{}');
            const { researchId, ...welcomeScreenData } = requestBody;
            if (!researchId) {
                return (0, response_1.createResponse)(400, { message: 'Research ID is required' }, {}, origin);
            }
            // Guardar la configuración
            const result = await this.welcomeScreenService.saveWelcomeScreen(researchId, userId, welcomeScreenData);
            return (0, response_1.createResponse)(200, { success: true, data: result }, {}, origin);
        }
        catch (error) {
            console.error('Error saving welcome screen:', error);
            return (0, response_1.createErrorResponse)(error, (0, response_1.getOriginFromEvent)(event));
        }
    }
    /**
     * Obtener la configuración del Welcome Screen
     */
    async getWelcomeScreen(event) {
        try {
            // Obtener el origen para los headers CORS
            const origin = (0, response_1.getOriginFromEvent)(event);
            // Autenticar al usuario y obtener su ID
            const userId = (0, auth_1.requireAuth)(event);
            // Obtener el ID de la investigación de los parámetros de ruta
            const researchId = event.pathParameters?.researchId;
            if (!researchId) {
                return (0, response_1.createResponse)(400, { message: 'Research ID is required' }, {}, origin);
            }
            // Obtener la configuración
            const welcomeScreen = await this.welcomeScreenService.getWelcomeScreen(researchId, userId);
            if (!welcomeScreen) {
                return (0, response_1.createResponse)(404, { message: 'Welcome screen not found' }, {}, origin);
            }
            return (0, response_1.createResponse)(200, { success: true, data: welcomeScreen }, {}, origin);
        }
        catch (error) {
            console.error('Error getting welcome screen:', error);
            return (0, response_1.createErrorResponse)(error, (0, response_1.getOriginFromEvent)(event));
        }
    }
}
exports.WelcomeScreenController = WelcomeScreenController;
// Instancia del controlador para las funciones Lambda
const welcomeScreenController = new WelcomeScreenController();
// Exportar funciones para serverless
const save = (event) => welcomeScreenController.saveWelcomeScreen(event);
exports.save = save;
const get = (event) => welcomeScreenController.getWelcomeScreen(event);
exports.get = get;
//# sourceMappingURL=welcome-screen.controller.js.map