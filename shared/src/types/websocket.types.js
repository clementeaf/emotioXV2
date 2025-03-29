"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebSocketMessage = exports.isWebSocketEvent = exports.errorMessageSchema = exports.tokenRefreshResponseSchema = exports.webSocketConfigSchema = exports.WebSocketEvent = void 0;
const zod_1 = require("zod");
var WebSocketEvent;
(function (WebSocketEvent) {
    WebSocketEvent["PING"] = "PING";
    WebSocketEvent["PONG"] = "PONG";
    WebSocketEvent["UNKNOWN"] = "UNKNOWN";
    WebSocketEvent["TOKEN_REFRESH"] = "TOKEN_REFRESH";
    WebSocketEvent["TOKEN_REFRESHED"] = "TOKEN_REFRESHED";
    WebSocketEvent["ERROR"] = "ERROR";
    WebSocketEvent["TOKEN_UPDATE"] = "token.update";
    WebSocketEvent["CONNECT"] = "connect";
    WebSocketEvent["DISCONNECT"] = "disconnect";
    WebSocketEvent["EMOTION_CREATED"] = "emotion.created";
    WebSocketEvent["EMOTION_UPDATED"] = "emotion.updated";
    WebSocketEvent["EMOTION_DELETED"] = "emotion.deleted";
})(WebSocketEvent = exports.WebSocketEvent || (exports.WebSocketEvent = {}));
exports.webSocketConfigSchema = zod_1.z.object({
    url: zod_1.z.string(),
    token: zod_1.z.string().optional(),
    cors: zod_1.z.object({
        origin: zod_1.z.array(zod_1.z.string()),
        credentials: zod_1.z.boolean()
    }),
    path: zod_1.z.string().optional(),
    reconnection: zod_1.z.object({
        maxAttempts: zod_1.z.number().min(1).default(5),
        baseDelay: zod_1.z.number().min(100).default(1000),
        maxDelay: zod_1.z.number().min(1000).default(30000)
    }).optional()
});
exports.tokenRefreshResponseSchema = zod_1.z.object({
    token: zod_1.z.string()
});
exports.errorMessageSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string()
});
const isWebSocketEvent = (value) => typeof value === 'string' && Object.values(WebSocketEvent).includes(value);
exports.isWebSocketEvent = isWebSocketEvent;
const isWebSocketMessage = (value) => typeof value === 'object' &&
    value !== null &&
    'event' in value &&
    'data' in value &&
    (0, exports.isWebSocketEvent)(value.event);
exports.isWebSocketMessage = isWebSocketMessage;
//# sourceMappingURL=websocket.types.js.map