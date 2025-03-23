"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delete_ = exports.update = exports.list = exports.get = exports.create = exports.ResearchController = void 0;
const research_service_1 = require("../services/research.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const response_middleware_1 = require("../middlewares/response.middleware");
const error_middleware_2 = require("../middlewares/error.middleware");
/**
 * Controlador para las investigaciones
 */
class ResearchController {
    /**
     * Crea una nueva investigación
     */
    async create(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Validar que el cuerpo de la solicitud existe
            if (!event.body) {
                throw new error_middleware_1.ValidationError('Request body is required');
            }
            // Parsear el cuerpo de la solicitud
            const data = JSON.parse(event.body);
            // Validar campos requeridos
            if (!data.name || !data.type || !data.technique || !data.description || !data.enterprise) {
                throw new error_middleware_1.ValidationError('Name, type, technique, description and enterprise are required');
            }
            // Crear investigación
            const research = await research_service_1.researchService.createResearch({
                userId,
                name: data.name,
                type: data.type,
                technique: data.technique,
                description: data.description,
                enterprise: data.enterprise,
                targetParticipants: data.targetParticipants
            });
            // Devolver respuesta exitosa
            return (0, response_middleware_1.createdResponse)(research, 'Research created successfully');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Obtiene una investigación por su ID
     */
    async get(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID de la investigación
            const researchId = event.pathParameters?.id;
            if (!researchId) {
                throw new error_middleware_1.ValidationError('Research ID is required');
            }
            // Obtener investigación
            const research = await research_service_1.researchService.getResearchById(researchId);
            if (!research) {
                throw new error_middleware_1.NotFoundError('Research not found');
            }
            // Verificar que el usuario es propietario de la investigación
            if (research.userId !== userId) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to access this research');
            }
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(research);
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Lista todas las investigaciones del usuario
     */
    async list(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener investigaciones
            const researches = await research_service_1.researchService.getResearchByUserId(userId);
            // Si no hay investigaciones, devolver array vacío
            if (researches.length === 0) {
                return (0, response_middleware_1.emptyArrayResponse)('No researches found');
            }
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(researches);
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Actualiza una investigación
     */
    async update(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID de la investigación
            const researchId = event.pathParameters?.id;
            if (!researchId) {
                throw new error_middleware_1.ValidationError('Research ID is required');
            }
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
            // Verificar que el usuario es propietario de la investigación
            const isOwner = await research_service_1.researchService.isResearchOwner(userId, researchId);
            if (!isOwner) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to update this research');
            }
            // Actualizar investigación
            const updatedResearch = await research_service_1.researchService.updateResearch(researchId, updateData);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(updatedResearch, 'Research updated successfully');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Elimina una investigación
     */
    async delete(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID de la investigación
            const researchId = event.pathParameters?.id;
            if (!researchId) {
                throw new error_middleware_1.ValidationError('Research ID is required');
            }
            // Verificar que el usuario es propietario de la investigación
            const isOwner = await research_service_1.researchService.isResearchOwner(userId, researchId);
            if (!isOwner) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to delete this research');
            }
            // Eliminar investigación
            await research_service_1.researchService.deleteResearch(researchId);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.noContentResponse)();
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
}
exports.ResearchController = ResearchController;
// Instancia del controlador para las funciones Lambda
const researchController = new ResearchController();
// Exportar funciones para serverless
const create = (event) => researchController.create(event);
exports.create = create;
const get = (event) => researchController.get(event);
exports.get = get;
const list = (event) => researchController.list(event);
exports.list = list;
const update = (event) => researchController.update(event);
exports.update = update;
const delete_ = (event) => researchController.delete(event);
exports.delete_ = delete_;
//# sourceMappingURL=research.controller.js.map