/**
 * Modelo de datos para la investigación
 * Este archivo define las interfaces que se utilizan tanto en el frontend como en el backend
 */
/**
 * Tipos de investigación soportados
 */
export var ResearchType;
(function (ResearchType) {
    ResearchType["EYE_TRACKING"] = "eye-tracking";
    ResearchType["ATTENTION_PREDICTION"] = "attention-prediction";
    ResearchType["COGNITIVE_ANALYSIS"] = "cognitive-analysis";
    ResearchType["BEHAVIOURAL"] = "behavioural";
})(ResearchType || (ResearchType = {}));
/**
 * Técnicas de investigación disponibles
 */
export var ResearchTechnique;
(function (ResearchTechnique) {
    ResearchTechnique["BIOMETRIC"] = "biometric";
    ResearchTechnique["AIM_FRAMEWORK"] = "aim-framework";
})(ResearchTechnique || (ResearchTechnique = {}));
/**
 * Estados posibles de una investigación
 */
export var ResearchStatus;
(function (ResearchStatus) {
    ResearchStatus["DRAFT"] = "draft";
    ResearchStatus["IN_PROGRESS"] = "in-progress";
    ResearchStatus["COMPLETED"] = "completed";
    ResearchStatus["ARCHIVED"] = "archived";
})(ResearchStatus || (ResearchStatus = {}));
/**
 * Funciones de utilidad para trabajar con investigaciones
 */
/**
 * Genera un ID de investigación único
 * @returns Un ID único para la investigación
 */
export function generateResearchId() {
    return "research-".concat(Date.now(), "-").concat(Math.floor(Math.random() * 1000));
}
/**
 * Crea una investigación simulada
 * @param data Los datos básicos para crear la investigación
 * @returns Una respuesta simulada de creación exitosa
 */
export function createMockResearch(data) {
    return {
        id: generateResearchId(),
        name: data.name,
        enterprise: data.enterprise,
        type: data.type || ResearchType.BEHAVIOURAL,
        technique: data.technique || '',
        status: ResearchStatus.DRAFT,
        createdAt: new Date().toISOString(),
        accessUrl: "/dashboard?research=".concat(generateResearchId())
    };
}
/**
 * Verifica si una investigación es de tipo AIM Framework
 * @param research La investigación a verificar
 * @returns true si la investigación utiliza la técnica AIM Framework
 */
export function isAIMFrameworkResearch(research) {
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
export function isAIMFrameworkConfig(config) {
    return 'smartVOC' in config || 'welcomeScreen' in config;
}
