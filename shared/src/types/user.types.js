"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = exports.userSchema = void 0;
var zod_1 = require("zod");
// Esquemas de validación
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email('Invalid email format')
});
// Type guard
var isUser = function (value) {
    return exports.userSchema.safeParse(value).success;
};
exports.isUser = isUser;
