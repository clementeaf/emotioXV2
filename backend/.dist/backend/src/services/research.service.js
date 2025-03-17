"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.researchService = exports.ResearchService = void 0;
const research_model_1 = require("../models/research.model");
const form_model_1 = require("../models/form.model");
class ResearchService {
    constructor() {
        this.tableName = process.env.RESEARCH_TABLE_NAME || 'Research';
        console.log('ResearchService inicializado con tabla:', this.tableName);
    }
    /**
     * Crea una nueva investigación
     */
    async createResearch(data) {
        return research_model_1.researchModel.create(data);
    }
    /**
     * Obtiene una investigación por su ID
     */
    async getResearchById(id) {
        return research_model_1.researchModel.findById(id);
    }
    /**
     * Obtiene todas las investigaciones de un usuario
     */
    async getResearchByUserId(userId) {
        return research_model_1.researchModel.findByUserId(userId);
    }
    /**
     * Actualiza una investigación
     */
    async updateResearch(id, data) {
        return research_model_1.researchModel.update(id, data);
    }
    /**
     * Actualiza el estado de una investigación
     */
    async updateResearchStatus(id, status) {
        // Convertir el tipo de status si es necesario
        const modelStatus = status;
        return research_model_1.researchModel.updateStatus(id, modelStatus);
    }
    /**
     * Actualiza el progreso de una investigación
     */
    async updateResearchProgress(id, progress) {
        return research_model_1.researchModel.updateProgress(id, progress);
    }
    /**
     * Elimina una investigación y todos sus formularios asociados
     */
    async deleteResearch(id) {
        // Primero eliminar todos los formularios asociados
        await form_model_1.formModel.deleteByResearchId(id);
        // Luego eliminar la investigación
        await research_model_1.researchModel.delete(id);
    }
    /**
     * Verifica si un usuario es propietario de una investigación
     */
    async isResearchOwner(userId, researchId) {
        const research = await research_model_1.researchModel.findById(researchId);
        return research !== null && research.userId === userId;
    }
}
exports.ResearchService = ResearchService;
// Singleton para reutilizar en toda la aplicación
exports.researchService = new ResearchService();
//# sourceMappingURL=research.service.js.map