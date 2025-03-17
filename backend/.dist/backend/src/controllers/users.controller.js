"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.UsersController = void 0;
const users_service_1 = require("../services/users.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const response_middleware_1 = require("../middlewares/response.middleware");
const error_middleware_2 = require("../middlewares/error.middleware");
/**
 * Controlador para los usuarios
 */
class UsersController {
    /**
     * Obtiene el usuario actual
     */
    async getUser(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener usuario
            const user = await users_service_1.usersService.getUserById(userId);
            if (!user) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(user);
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Actualiza el usuario actual
     */
    async updateUser(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Validar que el cuerpo de la solicitud existe
            if (!event.body) {
                throw new error_middleware_1.ValidationError('Request body is required');
            }
            // Parsear el cuerpo de la solicitud
            const updateData = JSON.parse(event.body);
            // Validar que hay datos para actualizar
            if (Object.keys(updateData).length === 0) {
                throw new error_middleware_1.ValidationError('No data provided for update');
            }
            // Actualizar usuario
            const updatedUser = await users_service_1.usersService.updateUser(userId, updateData);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(updatedUser, 'User updated successfully');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Elimina el usuario actual
     */
    async deleteUser(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Eliminar usuario
            await users_service_1.usersService.deleteUser(userId);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.noContentResponse)();
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
}
exports.UsersController = UsersController;
// Instancia del controlador para las funciones Lambda
const usersController = new UsersController();
// Exportar funciones para serverless
const getUser = (event) => usersController.getUser(event);
exports.getUser = getUser;
const updateUser = (event) => usersController.updateUser(event);
exports.updateUser = updateUser;
const deleteUser = (event) => usersController.deleteUser(event);
exports.deleteUser = deleteUser;
//# sourceMappingURL=users.controller.js.map