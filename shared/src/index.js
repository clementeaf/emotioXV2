"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQuestionDictionary = exports.DEFAULT_RESEARCH_CONFIG = exports.userSchema = exports.isUserBySchema = void 0;
// Tipos básicos
__exportStar(require("./types/auth.types"), exports);
__exportStar(require("./types/emotion.types"), exports);
__exportStar(require("./types/websocket.types"), exports);
// Tipos de usuario con manejo de conflictos
var user_types_1 = require("./types/user.types");
Object.defineProperty(exports, "isUserBySchema", { enumerable: true, get: function () { return user_types_1.isUser; } });
Object.defineProperty(exports, "userSchema", { enumerable: true, get: function () { return user_types_1.userSchema; } });
// Re-exportar todos los modelos de research
__exportStar(require("../interfaces/research.model"), exports);
// Exportar selectivamente de research.interface para evitar conflictos
var research_interface_1 = require("../interfaces/research.interface");
Object.defineProperty(exports, "DEFAULT_RESEARCH_CONFIG", { enumerable: true, get: function () { return research_interface_1.DEFAULT_RESEARCH_CONFIG; } });
// Exportar modelo de pantalla de bienvenida
__exportStar(require("../interfaces/welcome-screen.interface"), exports);
__exportStar(require("../utils"), exports);
var buildQuestionDictionary_1 = require("../utils/buildQuestionDictionary");
Object.defineProperty(exports, "buildQuestionDictionary", { enumerable: true, get: function () { return buildQuestionDictionary_1.buildQuestionDictionary; } });
