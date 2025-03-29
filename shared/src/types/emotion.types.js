"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmotionCategory = exports.isEmotionIntensity = exports.updateEmotionSchema = exports.createEmotionSchema = exports.emotionBaseSchema = exports.EmotionCategory = exports.EmotionIntensity = void 0;
const zod_1 = require("zod");
var EmotionIntensity;
(function (EmotionIntensity) {
    EmotionIntensity["LOW"] = "LOW";
    EmotionIntensity["MEDIUM"] = "MEDIUM";
    EmotionIntensity["HIGH"] = "HIGH";
})(EmotionIntensity = exports.EmotionIntensity || (exports.EmotionIntensity = {}));
var EmotionCategory;
(function (EmotionCategory) {
    EmotionCategory["BASIC"] = "BASIC";
    EmotionCategory["COMPLEX"] = "COMPLEX";
    EmotionCategory["SOCIAL"] = "SOCIAL";
})(EmotionCategory = exports.EmotionCategory || (exports.EmotionCategory = {}));
exports.emotionBaseSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
    description: zod_1.z.string().min(10).max(500),
    intensity: zod_1.z.nativeEnum(EmotionIntensity),
    category: zod_1.z.nativeEnum(EmotionCategory),
    tags: zod_1.z.array(zod_1.z.string().min(2).max(20)).min(1).max(5)
});
exports.createEmotionSchema = exports.emotionBaseSchema;
exports.updateEmotionSchema = exports.emotionBaseSchema.partial();
const isEmotionIntensity = (value) => typeof value === 'string' && Object.values(EmotionIntensity).includes(value);
exports.isEmotionIntensity = isEmotionIntensity;
const isEmotionCategory = (value) => typeof value === 'string' && Object.values(EmotionCategory).includes(value);
exports.isEmotionCategory = isEmotionCategory;
//# sourceMappingURL=emotion.types.js.map