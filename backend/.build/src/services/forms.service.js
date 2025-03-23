"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formsService = exports.FormsService = void 0;
const form_model_1 = require("../models/form.model");
const form_response_model_1 = require("../models/form-response.model");
const research_service_1 = require("./research.service");
class FormsService {
    /**
     * Crea un nuevo formulario
     */
    async createForm(data) {
        // Convertir la estructura de datos recibida al formato esperado por el modelo
        const formData = {
            userId: data.userId,
            researchId: data.researchId,
            type: 'custom', // Por defecto es un formulario personalizado
            title: data.title,
            description: data.description || '',
            fields: data.questions,
            isEnabled: true,
            order: 0, // Por defecto es el primer formulario
            isPublished: data.isPublished || false
        };
        return form_model_1.formModel.create(formData);
    }
    /**
     * Obtiene un formulario por su ID
     */
    async getFormById(id) {
        return form_model_1.formModel.findById(id);
    }
    /**
     * Obtiene todos los formularios de una investigación
     */
    async getFormsByResearchId(researchId, userId) {
        // Verificar que el usuario tiene acceso a la investigación
        const hasAccess = await research_service_1.researchService.isResearchOwner(userId, researchId);
        if (!hasAccess) {
            return [];
        }
        return form_model_1.formModel.findByResearchId(researchId);
    }
    /**
     * Obtiene todos los formularios de un usuario
     */
    async getFormsByUserId(userId) {
        // Implementar la búsqueda de formularios por userId
        // Esto podría requerir un nuevo índice en DynamoDB o una consulta filtrada
        // Por ahora, podemos obtener todas las investigaciones del usuario y luego sus formularios
        const researches = await research_service_1.researchService.getResearchByUserId(userId);
        if (researches.length === 0) {
            return [];
        }
        // Obtener formularios para cada investigación
        const formPromises = researches.map(research => form_model_1.formModel.findByResearchId(research.id));
        const formArrays = await Promise.all(formPromises);
        // Aplanar el array de arrays
        return formArrays.flat();
    }
    /**
     * Actualiza un formulario
     */
    async updateForm(id, data) {
        // Convertir la estructura de datos recibida al formato esperado por el modelo
        const updateData = {};
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.questions !== undefined)
            updateData.fields = data.questions;
        if (data.isPublished !== undefined)
            updateData.isPublished = data.isPublished;
        return form_model_1.formModel.update(id, updateData);
    }
    /**
     * Elimina un formulario
     */
    async deleteForm(id) {
        await form_model_1.formModel.delete(id);
    }
    /**
     * Publica un formulario
     */
    async publishForm(id) {
        return form_model_1.formModel.update(id, { isPublished: true });
    }
    /**
     * Despublica un formulario
     */
    async unpublishForm(id) {
        return form_model_1.formModel.update(id, { isPublished: false });
    }
    /**
     * Obtiene un formulario público por su ID
     * Solo devuelve formularios que estén publicados
     */
    async getPublicFormById(id) {
        const form = await form_model_1.formModel.findById(id);
        // Solo devolver el formulario si está publicado
        if (form && form.isPublished) {
            return form;
        }
        return null;
    }
    /**
     * Envía respuestas a un formulario
     */
    async submitResponses(formId, responses, respondentInfo) {
        // Verificar que el formulario existe y está publicado
        const form = await this.getPublicFormById(formId);
        if (!form) {
            throw new Error('Form not found or not published');
        }
        // Convertir las respuestas al formato del modelo
        const responseItems = responses.map(response => ({
            questionId: response.questionId,
            answer: response.answer
        }));
        // Crear la respuesta en la base de datos
        const formResponse = await form_response_model_1.formResponseModel.create({
            formId,
            researchId: form.researchId,
            responses: responseItems,
            respondentInfo
        });
        // Convertir al formato de respuesta de la API
        return {
            id: formResponse.id,
            formId: formResponse.formId,
            responses: formResponse.responses,
            respondentInfo: formResponse.respondentInfo,
            createdAt: formResponse.createdAt
        };
    }
    /**
     * Obtiene las respuestas de un formulario
     */
    async getFormResponses(formId) {
        // Obtener las respuestas de la base de datos
        const responses = await form_response_model_1.formResponseModel.findByFormId(formId);
        // Convertir al formato de respuesta de la API
        return responses.map(response => ({
            id: response.id,
            formId: response.formId,
            responses: response.responses,
            respondentInfo: response.respondentInfo,
            createdAt: response.createdAt
        }));
    }
    /**
     * Verifica si un usuario es propietario de un formulario
     */
    async isFormOwner(userId, formId) {
        const form = await form_model_1.formModel.findById(formId);
        return form !== null && form.userId === userId;
    }
    /**
     * Verifica si un usuario tiene acceso a un formulario a través de la investigación
     */
    async hasAccessToForm(userId, formId) {
        // Verificar si es propietario directo del formulario
        const isOwner = await this.isFormOwner(userId, formId);
        if (isOwner) {
            return true;
        }
        // Verificar si es propietario de la investigación asociada
        const form = await form_model_1.formModel.findById(formId);
        if (!form) {
            return false;
        }
        return research_service_1.researchService.isResearchOwner(userId, form.researchId);
    }
}
exports.FormsService = FormsService;
// Singleton para reutilizar en toda la aplicación
exports.formsService = new FormsService();
//# sourceMappingURL=forms.service.js.map