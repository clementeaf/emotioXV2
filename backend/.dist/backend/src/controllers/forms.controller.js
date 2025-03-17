"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponses = exports.submitResponses = exports.getPublic = exports.unpublish = exports.publish = exports.delete_ = exports.update = exports.list = exports.get = exports.create = exports.FormsController = void 0;
const forms_service_1 = require("../services/forms.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const response_middleware_1 = require("../middlewares/response.middleware");
const error_middleware_2 = require("../middlewares/error.middleware");
/**
 * Controlador para los formularios
 */
class FormsController {
    /**
     * Crea un nuevo formulario
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
            if (!data.researchId || !data.title || !data.questions) {
                throw new error_middleware_1.ValidationError('Research ID, title and questions are required');
            }
            // Validar que las preguntas sean un array no vacío
            if (!Array.isArray(data.questions) || data.questions.length === 0) {
                throw new error_middleware_1.ValidationError('Questions must be a non-empty array');
            }
            // Crear formulario
            const form = await forms_service_1.formsService.createForm({
                userId,
                researchId: data.researchId,
                title: data.title,
                description: data.description || '',
                questions: data.questions,
                isPublished: data.isPublished || false
            });
            // Devolver respuesta exitosa
            return (0, response_middleware_1.createdResponse)(form, 'Form created successfully');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Obtiene un formulario por su ID
     */
    async get(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID del formulario
            const formId = event.pathParameters?.id;
            if (!formId) {
                throw new error_middleware_1.ValidationError('Form ID is required');
            }
            // Obtener formulario
            const form = await forms_service_1.formsService.getFormById(formId);
            if (!form) {
                throw new error_middleware_1.NotFoundError('Form not found');
            }
            // Verificar que el usuario es propietario del formulario
            if (form.userId !== userId) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to access this form');
            }
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(form);
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Lista todos los formularios del usuario
     */
    async list(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Verificar si se filtra por investigación
            const researchId = event.queryStringParameters?.researchId;
            // Obtener formularios
            let forms;
            if (researchId) {
                forms = await forms_service_1.formsService.getFormsByResearchId(researchId, userId);
            }
            else {
                forms = await forms_service_1.formsService.getFormsByUserId(userId);
            }
            // Si no hay formularios, devolver array vacío
            if (forms.length === 0) {
                return (0, response_middleware_1.emptyArrayResponse)('No forms found');
            }
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(forms);
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Actualiza un formulario
     */
    async update(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID del formulario
            const formId = event.pathParameters?.id;
            if (!formId) {
                throw new error_middleware_1.ValidationError('Form ID is required');
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
            // Verificar que el usuario es propietario del formulario
            const isOwner = await forms_service_1.formsService.isFormOwner(userId, formId);
            if (!isOwner) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to update this form');
            }
            // Actualizar formulario
            const updatedForm = await forms_service_1.formsService.updateForm(formId, updateData);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(updatedForm, 'Form updated successfully');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Elimina un formulario
     */
    async delete(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID del formulario
            const formId = event.pathParameters?.id;
            if (!formId) {
                throw new error_middleware_1.ValidationError('Form ID is required');
            }
            // Verificar que el usuario es propietario del formulario
            const isOwner = await forms_service_1.formsService.isFormOwner(userId, formId);
            if (!isOwner) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to delete this form');
            }
            // Eliminar formulario
            await forms_service_1.formsService.deleteForm(formId);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.noContentResponse)();
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Publica un formulario
     */
    async publish(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID del formulario
            const formId = event.pathParameters?.id;
            if (!formId) {
                throw new error_middleware_1.ValidationError('Form ID is required');
            }
            // Verificar que el usuario es propietario del formulario
            const isOwner = await forms_service_1.formsService.isFormOwner(userId, formId);
            if (!isOwner) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to publish this form');
            }
            // Publicar formulario
            const publishedForm = await forms_service_1.formsService.publishForm(formId);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(publishedForm, 'Form published successfully');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Despublica un formulario
     */
    async unpublish(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID del formulario
            const formId = event.pathParameters?.id;
            if (!formId) {
                throw new error_middleware_1.ValidationError('Form ID is required');
            }
            // Verificar que el usuario es propietario del formulario
            const isOwner = await forms_service_1.formsService.isFormOwner(userId, formId);
            if (!isOwner) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to unpublish this form');
            }
            // Despublicar formulario
            const unpublishedForm = await forms_service_1.formsService.unpublishForm(formId);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(unpublishedForm, 'Form unpublished successfully');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Obtiene un formulario público por su ID
     */
    async getPublic(event) {
        try {
            // Obtener ID del formulario
            const formId = event.pathParameters?.id;
            if (!formId) {
                throw new error_middleware_1.ValidationError('Form ID is required');
            }
            // Obtener formulario
            const form = await forms_service_1.formsService.getPublicFormById(formId);
            if (!form) {
                throw new error_middleware_1.NotFoundError('Form not found or not published');
            }
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(form);
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Envía respuestas a un formulario
     */
    async submitResponses(event) {
        try {
            // Obtener ID del formulario
            const formId = event.pathParameters?.id;
            if (!formId) {
                throw new error_middleware_1.ValidationError('Form ID is required');
            }
            // Validar que el cuerpo de la solicitud existe
            if (!event.body) {
                throw new error_middleware_1.ValidationError('Request body is required');
            }
            // Parsear el cuerpo de la solicitud
            const data = JSON.parse(event.body);
            // Validar campos requeridos
            if (!data.responses || !Array.isArray(data.responses) || data.responses.length === 0) {
                throw new error_middleware_1.ValidationError('Responses must be a non-empty array');
            }
            // Enviar respuestas
            const submission = await forms_service_1.formsService.submitResponses(formId, data.responses, data.respondentInfo);
            // Devolver respuesta exitosa
            return (0, response_middleware_1.createdResponse)(submission, 'Responses submitted successfully');
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
    /**
     * Obtiene las respuestas de un formulario
     */
    async getResponses(event) {
        try {
            // Verificar autenticación
            const userId = (0, auth_middleware_1.authMiddleware)(event);
            // Obtener ID del formulario
            const formId = event.pathParameters?.id;
            if (!formId) {
                throw new error_middleware_1.ValidationError('Form ID is required');
            }
            // Verificar que el usuario es propietario del formulario
            const isOwner = await forms_service_1.formsService.isFormOwner(userId, formId);
            if (!isOwner) {
                throw new error_middleware_1.ForbiddenError('You do not have permission to access responses for this form');
            }
            // Obtener respuestas
            const responses = await forms_service_1.formsService.getFormResponses(formId);
            // Si no hay respuestas, devolver array vacío
            if (responses.length === 0) {
                return (0, response_middleware_1.emptyArrayResponse)('No responses found');
            }
            // Devolver respuesta exitosa
            return (0, response_middleware_1.successResponse)(responses);
        }
        catch (error) {
            return (0, error_middleware_2.errorHandler)(error);
        }
    }
}
exports.FormsController = FormsController;
// Instancia del controlador para las funciones Lambda
const formsController = new FormsController();
// Exportar funciones para serverless
const create = (event) => formsController.create(event);
exports.create = create;
const get = (event) => formsController.get(event);
exports.get = get;
const list = (event) => formsController.list(event);
exports.list = list;
const update = (event) => formsController.update(event);
exports.update = update;
const delete_ = (event) => formsController.delete(event);
exports.delete_ = delete_;
const publish = (event) => formsController.publish(event);
exports.publish = publish;
const unpublish = (event) => formsController.unpublish(event);
exports.unpublish = unpublish;
const getPublic = (event) => formsController.getPublic(event);
exports.getPublic = getPublic;
const submitResponses = (event) => formsController.submitResponses(event);
exports.submitResponses = submitResponses;
const getResponses = (event) => formsController.getResponses(event);
exports.getResponses = getResponses;
//# sourceMappingURL=forms.controller.js.map