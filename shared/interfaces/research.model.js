"use strict";
/**
 * Modelo de datos para la investigación
 * Este archivo define las interfaces que se utilizan tanto en el frontend como en el backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchStatus = exports.ResearchTechnique = exports.ResearchType = void 0;
exports.generateResearchId = generateResearchId;
exports.createMockResearch = createMockResearch;
exports.isAIMFrameworkResearch = isAIMFrameworkResearch;
exports.isAIMFrameworkConfig = isAIMFrameworkConfig;
/**
 * Tipos de investigación soportados
 */
var ResearchType;
(function (ResearchType) {
    ResearchType["EYE_TRACKING"] = "eye-tracking";
    ResearchType["ATTENTION_PREDICTION"] = "attention-prediction";
    ResearchType["COGNITIVE_ANALYSIS"] = "cognitive-analysis";
    ResearchType["BEHAVIOURAL"] = "behavioural";
})(ResearchType || (exports.ResearchType = ResearchType = {}));
/**
 * Técnicas de investigación disponibles
 */
var ResearchTechnique;
(function (ResearchTechnique) {
    ResearchTechnique["BIOMETRIC"] = "biometric";
    ResearchTechnique["AIM_FRAMEWORK"] = "aim-framework";
})(ResearchTechnique || (exports.ResearchTechnique = ResearchTechnique = {}));
/**
 * Estados posibles de una investigación
 */
var ResearchStatus;
(function (ResearchStatus) {
    ResearchStatus["DRAFT"] = "draft";
    ResearchStatus["IN_PROGRESS"] = "in-progress";
    ResearchStatus["COMPLETED"] = "completed";
    ResearchStatus["ARCHIVED"] = "archived";
})(ResearchStatus || (exports.ResearchStatus = ResearchStatus = {}));
/**
 * Funciones de utilidad para trabajar con investigaciones
 */
/**
 * Genera un ID de investigación único
 * @returns Un ID único para la investigación
 */
function generateResearchId() {
    return `research-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
/**
 * Crea una investigación simulada
 * @param data Los datos básicos para crear la investigación
 * @returns Una respuesta simulada de creación exitosa
 */
function createMockResearch(data) {
    return {
        id: generateResearchId(),
        name: data.name,
        enterprise: data.enterprise,
        type: data.type || ResearchType.BEHAVIOURAL,
        technique: data.technique || '',
        status: ResearchStatus.DRAFT,
        createdAt: new Date().toISOString(),
        accessUrl: `/dashboard?research=${generateResearchId()}`
    };
}
/**
 * Verifica si una investigación es de tipo AIM Framework
 * @param research La investigación a verificar
 * @returns true si la investigación utiliza la técnica AIM Framework
 */
function isAIMFrameworkResearch(research) {
    // Si es el tipo completo Research
    if ('basic' in research && research.basic && 'technique' in research.basic) {
        return research.basic.technique === ResearchTechnique.AIM_FRAMEWORK;
    }
    // Si es el tipo simplificado con technique directamente
    if ('technique' in research && research.technique) {
        return research.technique === ResearchTechnique.AIM_FRAMEWORK;
    }
    // Si no hay técnica, no es AIM Framework
    return false;
}
/**
 * Verifica si una configuración es de tipo AIM Framework
 * @param config La configuración a verificar
 * @returns true si la configuración es para AIM Framework
 */
function isAIMFrameworkConfig(config) {
    return 'smartVOC' in config || 'welcomeScreen' in config;
}
//# sourceMappingURL=research.model.js.map