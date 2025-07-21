"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWelcomeScreenForm = void 0;
var react_1 = require("react");
var welcomeScreenService_1 = require("@/services/welcomeScreenService");
var question_types_enum_1 = require("../../../../shared/interfaces/question-types.enum");
// Valor inicial: Usar WelcomeScreenData importada.
// Necesita definir metadata si WelcomeScreenData la requiere.
var INITIAL_FORM_DATA = {
    researchId: '',
    isEnabled: true,
    title: '',
    message: '',
    startButtonText: '',
    questionKey: '', // Asegura que siempre existe
    // Añadir metadata inicial para cumplir el tipo
    metadata: {
    // version, lastUpdated, lastModifiedBy son opcionales según la interfaz del servicio
    }
};
var useWelcomeScreenForm = function (researchId) {
    // Convertir 'current' a un ID válido cuando sea necesario (revisar esta lógica si aplica)
    var actualResearchId = researchId === 'current' ? '' : researchId; // Usar '' si es current y no hay ID real
    var _a = (0, react_1.useState)(INITIAL_FORM_DATA), formData = _a[0], setFormData = _a[1];
    var _b = (0, react_1.useState)({}), validationErrors = _b[0], setValidationErrors = _b[1];
    var _c = (0, react_1.useState)(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = (0, react_1.useState)(false), isSaving = _d[0], setIsSaving = _d[1];
    var _e = (0, react_1.useState)(null), existingScreen = _e[0], setExistingScreen = _e[1];
    var _f = (0, react_1.useState)(null), modalError = _f[0], setModalError = _f[1];
    var _g = (0, react_1.useState)(false), modalVisible = _g[0], setModalVisible = _g[1];
    // Estado para disparar un refetch manual después de guardar
    var _h = (0, react_1.useState)(0), refetchTrigger = _h[0], setRefetchTrigger = _h[1];
    var _j = (0, react_1.useState)(false), isEmpty = _j[0], setIsEmpty = _j[1];
    var _k = (0, react_1.useState)(false), isDeleting = _k[0], setIsDeleting = _k[1];
    // Mover fetchData fuera de useEffect y envolver con useCallback
    var fetchData = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var fetchedRecord, formDataToSet, error_1;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        return __generator(this, function (_q) {
            switch (_q.label) {
                case 0:
                    setIsLoading(true);
                    setIsEmpty(false);
                    _q.label = 1;
                case 1:
                    _q.trys.push([1, 3, 4, 5]);
                    if (!actualResearchId) {
                        setFormData(__assign(__assign({}, INITIAL_FORM_DATA), { researchId: '' }));
                        setExistingScreen(null);
                        setIsLoading(false);
                        setIsEmpty(true);
                        return [2 /*return*/];
                    }
                    // [FIX] Eliminar cualquier cacheo local de inexistencia
                    try {
                        localStorage.removeItem("welcome_screen_resource_".concat(actualResearchId));
                    }
                    catch (e) { /* ignorar errores de localStorage */ }
                    return [4 /*yield*/, welcomeScreenService_1.default.getByResearchId(actualResearchId)];
                case 2:
                    fetchedRecord = _q.sent();
                    if (fetchedRecord) {
                        setExistingScreen(fetchedRecord);
                        formDataToSet = {
                            researchId: fetchedRecord.researchId,
                            isEnabled: (_a = fetchedRecord.isEnabled) !== null && _a !== void 0 ? _a : true,
                            title: (_b = fetchedRecord.title) !== null && _b !== void 0 ? _b : '',
                            message: (_c = fetchedRecord.message) !== null && _c !== void 0 ? _c : '',
                            startButtonText: (_d = fetchedRecord.startButtonText) !== null && _d !== void 0 ? _d : '',
                            subtitle: (_e = fetchedRecord.subtitle) !== null && _e !== void 0 ? _e : '',
                            logoUrl: (_f = fetchedRecord.logoUrl) !== null && _f !== void 0 ? _f : '',
                            backgroundImageUrl: (_g = fetchedRecord.backgroundImageUrl) !== null && _g !== void 0 ? _g : '',
                            backgroundColor: (_h = fetchedRecord.backgroundColor) !== null && _h !== void 0 ? _h : '',
                            textColor: (_j = fetchedRecord.textColor) !== null && _j !== void 0 ? _j : '',
                            theme: (_k = fetchedRecord.theme) !== null && _k !== void 0 ? _k : '',
                            disclaimer: (_l = fetchedRecord.disclaimer) !== null && _l !== void 0 ? _l : '',
                            customCss: (_m = fetchedRecord.customCss) !== null && _m !== void 0 ? _m : '',
                            metadata: fetchedRecord.metadata
                        };
                        setFormData(formDataToSet);
                    }
                    else {
                        setFormData(__assign(__assign({}, INITIAL_FORM_DATA), { researchId: actualResearchId }));
                        setExistingScreen(null);
                        setIsEmpty(true);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _q.sent();
                    // Si el error es 404, tratar como vacío
                    if ((error_1 === null || error_1 === void 0 ? void 0 : error_1.statusCode) === 404 || ((_o = error_1 === null || error_1 === void 0 ? void 0 : error_1.message) === null || _o === void 0 ? void 0 : _o.includes('not found')) || ((_p = error_1 === null || error_1 === void 0 ? void 0 : error_1.message) === null || _p === void 0 ? void 0 : _p.includes('WELCOME_SCREEN_NOT_FOUND'))) {
                        setFormData(__assign(__assign({}, INITIAL_FORM_DATA), { researchId: actualResearchId }));
                        setExistingScreen(null);
                        setIsEmpty(true);
                    }
                    else {
                        setFormData(__assign(__assign({}, INITIAL_FORM_DATA), { researchId: actualResearchId }));
                        setExistingScreen(null);
                        setModalError({
                            title: 'Error',
                            message: 'No se pudo cargar la configuración de la pantalla de bienvenida.',
                            type: 'error'
                        });
                        setModalVisible(true);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [actualResearchId, setIsLoading, setFormData, setExistingScreen, setModalError, setModalVisible]);
    (0, react_1.useEffect)(function () {
        fetchData();
        // Dependencias de useEffect: fetchData y refetchTrigger
    }, [fetchData, refetchTrigger]);
    var validateForm = function () {
        var errors = {};
        if (!formData.title) {
            errors.title = 'El título es requerido';
        }
        if (!formData.message) {
            errors.message = 'El mensaje es requerido';
        }
        if (!formData.startButtonText) {
            errors.startButtonText = 'El texto del botón es requerido';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    var handleChange = (0, react_1.useCallback)(function (field, value) {
        setFormData(function (prev) {
            var _a;
            var _b, _c;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a.metadata = __assign(__assign({}, (prev.metadata || INITIAL_FORM_DATA.metadata)), { version: ((_b = prev.metadata) === null || _b === void 0 ? void 0 : _b.version) || '1.0', lastUpdated: new Date().toISOString(), lastModifiedBy: ((_c = prev.metadata) === null || _c === void 0 ? void 0 : _c.lastModifiedBy) || 'user' }), _a)));
        });
        if (validationErrors[field]) {
            setValidationErrors(function (prev) {
                var newErrors = __assign({}, prev);
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [validationErrors]);
    var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var dataToSubmit, resultRecord, createPayload, formDataFromResult, error_2;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    if (!validateForm()) {
                        setModalError({
                            title: 'Campos incompletos',
                            message: 'Por favor, complete todos los campos requeridos.',
                            type: 'warning'
                        });
                        setModalVisible(true);
                        return [2 /*return*/];
                    }
                    setIsSaving(true);
                    _o.label = 1;
                case 1:
                    _o.trys.push([1, 7, 8, 9]);
                    dataToSubmit = __assign(__assign({}, formData), { questionKey: formData.questionKey === question_types_enum_1.QuestionType.WELCOME_SCREEN ? formData.questionKey : question_types_enum_1.QuestionType.WELCOME_SCREEN });
                    resultRecord = void 0;
                    if (!((existingScreen === null || existingScreen === void 0 ? void 0 : existingScreen.id) && actualResearchId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, welcomeScreenService_1.default.updateForResearch(actualResearchId, existingScreen.id, dataToSubmit // Enviar solo los campos editables
                        )];
                case 2:
                    // console.log(`Llamando a updateForResearch con screenId: ${existingScreen.id}`);
                    // Pasar solo los datos de formData al servicio update
                    resultRecord = _o.sent();
                    return [3 /*break*/, 6];
                case 3:
                    if (!actualResearchId) return [3 /*break*/, 5];
                    createPayload = __assign(__assign(__assign({}, INITIAL_FORM_DATA), dataToSubmit), { researchId: actualResearchId // Asegurar researchId
                     });
                    return [4 /*yield*/, welcomeScreenService_1.default.createForResearch(actualResearchId, createPayload)];
                case 4:
                    resultRecord = _o.sent();
                    return [3 /*break*/, 6];
                case 5: throw new Error('No hay researchId válido para guardar.');
                case 6:
                    formDataFromResult = {
                        researchId: resultRecord.researchId,
                        isEnabled: (_a = resultRecord.isEnabled) !== null && _a !== void 0 ? _a : true,
                        title: (_b = resultRecord.title) !== null && _b !== void 0 ? _b : '',
                        message: (_c = resultRecord.message) !== null && _c !== void 0 ? _c : '',
                        startButtonText: (_d = resultRecord.startButtonText) !== null && _d !== void 0 ? _d : '',
                        subtitle: (_e = resultRecord.subtitle) !== null && _e !== void 0 ? _e : '',
                        logoUrl: (_f = resultRecord.logoUrl) !== null && _f !== void 0 ? _f : '',
                        backgroundImageUrl: (_g = resultRecord.backgroundImageUrl) !== null && _g !== void 0 ? _g : '',
                        backgroundColor: (_h = resultRecord.backgroundColor) !== null && _h !== void 0 ? _h : '',
                        textColor: (_j = resultRecord.textColor) !== null && _j !== void 0 ? _j : '',
                        theme: (_k = resultRecord.theme) !== null && _k !== void 0 ? _k : '',
                        disclaimer: (_l = resultRecord.disclaimer) !== null && _l !== void 0 ? _l : '',
                        customCss: (_m = resultRecord.customCss) !== null && _m !== void 0 ? _m : '',
                        metadata: resultRecord.metadata
                    };
                    // 2. Actualizar el estado del formulario PRIMERO
                    setFormData(formDataFromResult);
                    // 3. Disparar refetch para sincronizar con backend
                    setRefetchTrigger(function (prev) { return prev + 1; });
                    // 4. Actualizar el registro existente
                    setExistingScreen(resultRecord);
                    // 5. Mostrar el modal de éxito DESPUÉS
                    setModalError({
                        title: 'Éxito',
                        message: 'Pantalla de bienvenida guardada correctamente.',
                        type: 'info'
                    });
                    setModalVisible(true);
                    return [3 /*break*/, 9];
                case 7:
                    error_2 = _o.sent();
                    console.error('Error saving welcome screen:', error_2);
                    setModalError({
                        title: 'Error al Guardar',
                        message: "No se pudo guardar la pantalla de bienvenida: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)),
                        type: 'error'
                    });
                    setModalVisible(true);
                    return [3 /*break*/, 9];
                case 8:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var handlePreview = function () {
        if (!validateForm()) {
            setModalError({
                title: 'Campos incompletos',
                message: 'Por favor, complete todos los campos requeridos antes de previsualizar.',
                type: 'warning'
            });
            setModalVisible(true);
            return;
        }
        var previewWindow = window.open('', '_blank');
        if (previewWindow) {
            var title = formData.title, message = formData.message, startButtonText = formData.startButtonText;
            var previewHtml = "\n        <!DOCTYPE html>\n        <html lang=\"es\">\n        <head>\n          <meta charset=\"UTF-8\">\n          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n          <title>Vista previa - ".concat(title, "</title>\n          <style>\n            body { font-family: sans-serif; margin: 40px; background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 80px); }\n            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 600px; width: 90%; }\n            h1 { color: #333; margin-bottom: 15px; }\n            .message { color: #555; line-height: 1.6; margin-bottom: 25px; white-space: pre-wrap; }\n            button { background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; }\n            button:hover { background-color: #0056b3; }\n            .badge { position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; font-size: 12px; border-radius: 3px; }\n          </style>\n        </head>\n        <body>\n          <div class=\"badge\">Vista Previa</div>\n          <div class=\"container\">\n            <h1>").concat(title, "</h1>\n            <div class=\"message\">").concat(message.replace(/\n/g, '<br>'), "</div>\n            <button>").concat(startButtonText, "</button>\n          </div>\n        </body>\n        </html>\n      ");
            previewWindow.document.write(previewHtml);
            previewWindow.document.close();
        }
        else {
            setModalError({
                title: 'Error de Vista Previa',
                message: 'No se pudo abrir la ventana de vista previa. Por favor, habilite las ventanas emergentes.',
                type: 'error'
            });
            setModalVisible(true);
        }
    };
    var handleDelete = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(existingScreen === null || existingScreen === void 0 ? void 0 : existingScreen.id) || !actualResearchId)
                        return [2 /*return*/];
                    setIsDeleting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, welcomeScreenService_1.default.delete(actualResearchId, existingScreen.id)];
                case 2:
                    _a.sent();
                    setExistingScreen(null);
                    setFormData(__assign(__assign({}, INITIAL_FORM_DATA), { researchId: actualResearchId }));
                    setModalError({
                        title: 'Eliminado',
                        message: 'La pantalla de bienvenida fue eliminada correctamente.',
                        type: 'success'
                    });
                    setModalVisible(true);
                    setIsEmpty(true);
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    setModalError({
                        title: 'Error al eliminar',
                        message: (error_3 === null || error_3 === void 0 ? void 0 : error_3.message) || 'No se pudo eliminar la pantalla de bienvenida.',
                        type: 'error'
                    });
                    setModalVisible(true);
                    return [3 /*break*/, 5];
                case 4:
                    setIsDeleting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [existingScreen, actualResearchId, setExistingScreen, setFormData, setModalError, setModalVisible]);
    var closeModal = function () {
        setModalVisible(false);
        setModalError(null);
    };
    return {
        formData: formData,
        setFormData: setFormData,
        validationErrors: validationErrors,
        isLoading: isLoading,
        isSaving: isSaving,
        existingScreen: existingScreen,
        modalError: modalError,
        modalVisible: modalVisible,
        handleChange: handleChange,
        handleSubmit: handleSubmit,
        handlePreview: handlePreview,
        closeModal: closeModal,
        isEmpty: isEmpty,
        handleDelete: handleDelete,
        isDeleting: isDeleting,
        showDelete: !!(existingScreen === null || existingScreen === void 0 ? void 0 : existingScreen.id),
    };
};
exports.useWelcomeScreenForm = useWelcomeScreenForm;
