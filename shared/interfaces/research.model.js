"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAIMFrameworkConfig = exports.isAIMFrameworkResearch = exports.createMockResearch = exports.generateResearchId = exports.ResearchStatus = exports.ResearchTechnique = exports.ResearchType = void 0;
var ResearchType;
(function (ResearchType) {
    ResearchType["EYE_TRACKING"] = "eye-tracking";
    ResearchType["ATTENTION_PREDICTION"] = "attention-prediction";
    ResearchType["COGNITIVE_ANALYSIS"] = "cognitive-analysis";
    ResearchType["BEHAVIOURAL"] = "behavioural";
})(ResearchType = exports.ResearchType || (exports.ResearchType = {}));
var ResearchTechnique;
(function (ResearchTechnique) {
    ResearchTechnique["BIOMETRIC"] = "biometric";
    ResearchTechnique["AIM_FRAMEWORK"] = "aim-framework";
})(ResearchTechnique = exports.ResearchTechnique || (exports.ResearchTechnique = {}));
var ResearchStatus;
(function (ResearchStatus) {
    ResearchStatus["DRAFT"] = "draft";
    ResearchStatus["IN_PROGRESS"] = "in-progress";
    ResearchStatus["COMPLETED"] = "completed";
    ResearchStatus["ARCHIVED"] = "archived";
})(ResearchStatus = exports.ResearchStatus || (exports.ResearchStatus = {}));
function generateResearchId() {
    return `research-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
exports.generateResearchId = generateResearchId;
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
exports.createMockResearch = createMockResearch;
function isAIMFrameworkResearch(research) {
    if ('basic' in research && research.basic && 'technique' in research.basic) {
        return research.basic.technique === ResearchTechnique.AIM_FRAMEWORK;
    }
    if ('technique' in research && research.technique) {
        return research.technique === ResearchTechnique.AIM_FRAMEWORK;
    }
    return false;
}
exports.isAIMFrameworkResearch = isAIMFrameworkResearch;
function isAIMFrameworkConfig(config) {
    return 'smartVOC' in config || 'welcomeScreen' in config;
}
exports.isAIMFrameworkConfig = isAIMFrameworkConfig;
//# sourceMappingURL=research.model.js.map