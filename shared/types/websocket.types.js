"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebSocketMessage = exports.isWebSocketEvent = exports.errorMessageSchema = exports.tokenRefreshResponseSchema = exports.WebSocketEvent = void 0;
const zod_1 = require("zod");
var WebSocketEvent;
(function (WebSocketEvent) {
    WebSocketEvent["TOKEN_REFRESH"] = "token.refresh";
    WebSocketEvent["TOKEN_UPDATE"] = "token.update";
    WebSocketEvent["EMOTION_CREATED"] = "emotion.created";
    WebSocketEvent["EMOTION_UPDATED"] = "emotion.updated";
    WebSocketEvent["EMOTION_DELETED"] = "emotion.deleted";
    WebSocketEvent["ERROR"] = "error";
})(WebSocketEvent = exports.WebSocketEvent || (exports.WebSocketEvent = {}));
exports.tokenRefreshResponseSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required')
});
exports.errorMessageSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string()
});
const isWebSocketEvent = (value) => {
    return Object.values(WebSocketEvent).includes(value);
};
exports.isWebSocketEvent = isWebSocketEvent;
const isWebSocketMessage = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'event' in value &&
        'data' in value &&
        (0, exports.isWebSocketEvent)(value.event));
};
exports.isWebSocketMessage = isWebSocketMessage;
//# sourceMappingURL=websocket.types.js.map