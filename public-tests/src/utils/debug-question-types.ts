/**
 * Script de debug para verificar el mapeo de tipos de preguntas
 * Este archivo ayuda a identificar problemas con el doble prefijo cognitive_
 */

export const debugQuestionTypeMapping = () => {
  console.log('🔍 DEBUG: Verificando mapeo de tipos de preguntas...');

  // Casos de prueba
  const testCases = [
    'short_text',
    'long_text',
    'single_choice',
    'multiple_choice',
    'linear_scale',
    'ranking',
    'navigation_flow',
    'preference_test',
    'cognitive_short_text', // Ya tiene prefijo
    'cognitive_long_text',  // Ya tiene prefijo
  ];

  testCases.forEach(originalType => {
    // Simular la lógica de mapeo
    const hasCognitivePrefix = typeof originalType === 'string' && originalType.startsWith('cognitive_');
    const mappedType = hasCognitivePrefix
      ? originalType
      : `cognitive_${originalType}`;

    console.log(`📝 ${originalType} → ${mappedType} ${hasCognitivePrefix ? '(ya tenía prefijo)' : '(prefijo agregado)'}`);
  });
};

// Función para verificar si un tipo tiene doble prefijo
export const hasDoubleCognitivePrefix = (type: string): boolean => {
  return type.includes('cognitive_cognitive_');
};

// Función para limpiar doble prefijo
export const cleanDoublePrefix = (type: string): string => {
  if (hasDoubleCognitivePrefix(type)) {
    return type.replace('cognitive_cognitive_', 'cognitive_');
  }
  return type;
};

// Exportar para uso en otros archivos
export default {
  debugQuestionTypeMapping,
  hasDoubleCognitivePrefix,
  cleanDoublePrefix
};
