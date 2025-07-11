import { QuestionType } from '../interfaces/question-types.enum';

/**
 * Construye el diccionario global de preguntas usando el ENUM estándar
 *
 * REGLAS:
 * - Todos los tipos deben estar en el ENUM QuestionType
 * - Los questionKey se generan usando el ENUM
 * - Si un tipo no está en el ENUM, se marca como error
 */
export function buildQuestionDictionary(expandedSteps: any[]): Record<string, any> {
    const questionDictionary: Record<string, any> = {};

    expandedSteps.forEach((step) => {
        if (!step || typeof step !== 'object') return;

        const stepType = step.type;
        const stepId = step.id || step.questionId || 'unknown';

        // Fallback automático para title y module
        if (!step.title) step.title = step.name || 'Sin título';
        if (!step.module) {
            if (stepType === 'welcome' || stepType === 'welcome_screen') step.module = 'welcome_screen';
            else if (stepType === 'thankyou' || stepType === 'thank_you_screen') step.module = 'thank_you_screen';
            else if (stepType === 'demographic' || stepType === 'demographics') step.module = 'demographics';
            else step.module = 'custom';
        }

        // 1. Validar si el tipo está en el ENUM
        const isValidType = Object.values(QuestionType).includes(stepType);

        let mainQuestionKey = '';

        if (isValidType) {
            // 2. Generar questionKey usando el tipo del ENUM
            const questionKey = `${stepType}_${stepId}`;
            mainQuestionKey = questionKey;

            // 3. Agregar al diccionario con el tipo del ENUM
            questionDictionary[questionKey] = {
                ...step,
                type: stepType,
                questionKey: questionKey,
                renderComponent: stepType, // Para compatibilidad con el frontend
            };

            // Alias para stepId si es paso core
            if ([QuestionType.DEMOGRAPHICS, QuestionType.WELCOME_SCREEN, QuestionType.THANK_YOU_SCREEN].includes(stepType) ||
                ['demographic', 'demographics', 'welcome', 'welcome_screen', 'thankyou', 'thank_you_screen'].includes(stepId)) {
                // Alias para todas las variantes posibles
                if (stepId === 'demographic' || stepId === 'demographics') {
                    questionDictionary['demographic'] = questionDictionary[mainQuestionKey];
                    questionDictionary['demographics'] = questionDictionary[mainQuestionKey];
                }
                if (stepId === 'welcome' || stepId === 'welcome_screen') {
                    questionDictionary['welcome'] = questionDictionary[mainQuestionKey];
                    questionDictionary['welcome_screen'] = questionDictionary[mainQuestionKey];
                }
                if (stepId === 'thankyou' || stepId === 'thank_you_screen') {
                    questionDictionary['thankyou'] = questionDictionary[mainQuestionKey];
                    questionDictionary['thank_you_screen'] = questionDictionary[mainQuestionKey];
                }
            }

            console.log(`[buildQuestionDictionary] ✅ Tipo válido: ${stepType}, questionKey: ${questionKey}`);
        } else {
            // 4. Intentar mapear tipos legacy a tipos del ENUM
            const legacyMapping: Record<string, QuestionType> = {
                'welcome': QuestionType.WELCOME_SCREEN,
                'thankyou': QuestionType.THANK_YOU_SCREEN,
                'demographic': QuestionType.DEMOGRAPHICS,
                'demographics': QuestionType.DEMOGRAPHICS,
                'welcome_screen': QuestionType.WELCOME_SCREEN,
                'thank_you_screen': QuestionType.THANK_YOU_SCREEN
            };

            const mappedType = legacyMapping[stepType];
            if (mappedType) {
                const questionKey = `${mappedType}_${stepId}`;
                mainQuestionKey = questionKey;
                questionDictionary[questionKey] = {
                    ...step,
                    type: mappedType,
                    questionKey: questionKey,
                    renderComponent: mappedType,
                    originalType: stepType // Preservar el tipo original
                };
                // Alias para stepId si es paso core legacy
                if ([QuestionType.DEMOGRAPHICS, QuestionType.WELCOME_SCREEN, QuestionType.THANK_YOU_SCREEN].includes(mappedType)) {
                    questionDictionary[stepId] = questionDictionary[questionKey];
                }
                console.log(`[buildQuestionDictionary] 🔄 Tipo legacy mapeado: ${stepType} → ${mappedType}, questionKey: ${questionKey}`);
            } else {
                // 5. Tipo no soportado - marcar como error pero no romper
                const fallbackQuestionKey = `unknown_${stepId}`;
                mainQuestionKey = fallbackQuestionKey;
                questionDictionary[fallbackQuestionKey] = {
                    ...step,
                    type: stepType,
                    questionKey: fallbackQuestionKey,
                    renderComponent: 'unknown',
                    error: `Tipo no soportado: ${stepType}`,
                };

                // Solo mostrar error para tipos realmente desconocidos
                if (!stepType.includes('test') && !stepType.includes('debug') && !stepType.includes('temp')) {
                    console.error(`[buildQuestionDictionary] ❌ Tipo no soportado: ${stepType}. Usando fallback: ${fallbackQuestionKey}`);
                }
            }
        }
    });

    return questionDictionary;
}

/**
 * Valida que todos los tipos en expandedSteps estén en el ENUM
 *
 * USO: Llamar antes de buildQuestionDictionary para detectar problemas
 */
export function validateQuestionTypes(expandedSteps: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    expandedSteps.forEach((step, index) => {
        if (!step || typeof step !== 'object') return;

        const stepType = step.type;
        if (!stepType) {
            errors.push(`Step ${index}: Sin tipo definido`);
            return;
        }

        const isValidType = Object.values(QuestionType).includes(stepType);
        if (!isValidType) {
            errors.push(`Step ${index}: Tipo no soportado "${stepType}"`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}
