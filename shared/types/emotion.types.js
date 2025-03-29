"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmotionCategory = exports.isEmotionIntensity = exports.updateEmotionSchema = exports.createEmotionSchema = exports.emotionBaseSchema = exports.EmotionCategory = exports.EmotionIntensity = void 0;
const zod_1 = require("zod");
var EmotionIntensity;
(function (EmotionIntensity) {
    EmotionIntensity["LOW"] = "low";
    EmotionIntensity["MEDIUM"] = "medium";
    EmotionIntensity["HIGH"] = "high";
})(EmotionIntensity = exports.EmotionIntensity || (exports.EmotionIntensity = {}));
var EmotionCategory;
(function (EmotionCategory) {
    EmotionCategory["BASIC"] = "basic";
    EmotionCategory["COMPLEX"] = "complex";
    EmotionCategory["SOCIAL"] = "social";
})(EmotionCategory = exports.EmotionCategory || (exports.EmotionCategory = {}));
exports.emotionBaseSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
    description: zod_1.z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description must be less than 500 characters'),
    intensity: zod_1.z.nativeEnum(EmotionIntensity),
    category: zod_1.z.nativeEnum(EmotionCategory),
    tags: zod_1.z.array(zod_1.z.string())
        .min(1, 'At least one tag is required')
        .max(10, 'Maximum 10 tags allowed')
});
exports.createEmotionSchema = exports.emotionBaseSchema;
exports.updateEmotionSchema = exports.emotionBaseSchema.partial();
const isEmotionIntensity = (value) => {
    return Object.values(EmotionIntensity).includes(value);
};
exports.isEmotionIntensity = isEmotionIntensity;
const isEmotionCategory = (value) => {
    return Object.values(EmotionCategory).includes(value);
};
exports.isEmotionCategory = isEmotionCategory;
//# sourceMappingURL=emotion.types.js.map