"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebSocketMessage = exports.isWebSocketEvent = exports.errorMessageSchema = exports.tokenRefreshResponseSchema = exports.WebSocketEvent = void 0;
var zod_1 = require("zod");
// WebSocket Event Names
var WebSocketEvent;
(function (WebSocketEvent) {
    // Auth events
    WebSocketEvent["TOKEN_REFRESH"] = "token.refresh";
    WebSocketEvent["TOKEN_UPDATE"] = "token.update";
    // Emotion events
    WebSocketEvent["EMOTION_CREATED"] = "emotion.created";
    WebSocketEvent["EMOTION_UPDATED"] = "emotion.updated";
    WebSocketEvent["EMOTION_DELETED"] = "emotion.deleted";
    // Error events
    WebSocketEvent["ERROR"] = "error";
})(WebSocketEvent || (exports.WebSocketEvent = WebSocketEvent = {}));
// Zod Schemas for validation
exports.tokenRefreshResponseSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required')
});
exports.errorMessageSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string()
});
// Type guards
var isWebSocketEvent = function (value) {
    return Object.values(WebSocketEvent).includes(value);
};
exports.isWebSocketEvent = isWebSocketEvent;
var isWebSocketMessage = function (value) {
    return (typeof value === 'object' &&
        value !== null &&
        'event' in value &&
        'data' in value &&
        (0, exports.isWebSocketEvent)(value.event));
};
exports.isWebSocketMessage = isWebSocketMessage;
