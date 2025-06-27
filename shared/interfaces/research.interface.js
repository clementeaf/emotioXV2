"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RESEARCH_CONFIG = exports.DEFAULT_RESEARCH_VALIDATION = exports.ResearchStage = exports.ResearchStatus = exports.ResearchType = void 0;
/**
 * Enum for research types
 */
var ResearchType;
(function (ResearchType) {
    ResearchType["EYE_TRACKING"] = "eye-tracking";
    ResearchType["ATTENTION_PREDICTION"] = "attention-prediction";
    ResearchType["COGNITIVE_ANALYSIS"] = "cognitive-analysis";
})(ResearchType || (exports.ResearchType = ResearchType = {}));
/**
 * Enum for research status
 */
var ResearchStatus;
(function (ResearchStatus) {
    ResearchStatus["DRAFT"] = "draft";
    ResearchStatus["IN_PROGRESS"] = "in-progress";
    ResearchStatus["COMPLETED"] = "completed";
    ResearchStatus["ARCHIVED"] = "archived";
})(ResearchStatus || (exports.ResearchStatus = ResearchStatus = {}));
/**
 * Enum for research stages
 */
var ResearchStage;
(function (ResearchStage) {
    ResearchStage["BUILD"] = "build";
    ResearchStage["RECRUIT"] = "recruit";
    ResearchStage["RESULTS"] = "results";
})(ResearchStage || (exports.ResearchStage = ResearchStage = {}));
/**
 * Default validation rules for research
 */
exports.DEFAULT_RESEARCH_VALIDATION = {
    basic: {
        title: {
            minLength: 5,
            maxLength: 200,
            required: true
        },
        description: {
            minLength: 20,
            maxLength: 2000,
            required: true
        },
        targetParticipants: {
            min: 1,
            max: 10000,
            required: true
        },
        objectives: {
            minItems: 1,
            maxItems: 10,
            required: true
        }
    }
};
/**
 * Default research configuration
 */
exports.DEFAULT_RESEARCH_CONFIG = {
    basic: {
        title: '',
        description: '',
        type: ResearchType.EYE_TRACKING,
        targetParticipants: 100,
        objectives: [],
        tags: []
    },
    stages: {
        build: {
            hasWelcomeScreen: false,
            hasSmartVOC: false,
            hasCognitiveTasks: false,
            hasEyeTracking: false,
            hasThankYouScreen: false
        },
        recruit: {
            hasScreener: false,
            hasWelcomeScreen: false,
            hasImplicitAssociation: false,
            hasCognitiveTask: false,
            hasEyeTracking: false,
            hasThankYouScreen: false
        }
    },
    metadata: {
        version: '1.0.0'
    }
};
//# sourceMappingURL=research.interface.js.map