"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = exports.authResponseSchema = exports.validateOTPSchema = exports.requestOTPSchema = void 0;
const zod_1 = require("zod");
// Zod schemas
exports.requestOTPSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format')
});
exports.validateOTPSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    code: zod_1.z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must contain only numbers')
});
exports.authResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        email: zod_1.z.string().email()
    })
});
// Type guards
const isUser = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'email' in value &&
        'createdAt' in value &&
        'updatedAt' in value);
};
exports.isUser = isUser;
//# sourceMappingURL=auth.types.js.map