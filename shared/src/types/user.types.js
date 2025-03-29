"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = exports.userSchema = void 0;
const zod_1 = require("zod");
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email('Invalid email format')
});
const isUser = (value) => {
    return exports.userSchema.safeParse(value).success;
};
exports.isUser = isUser;
//# sourceMappingURL=user.types.js.map