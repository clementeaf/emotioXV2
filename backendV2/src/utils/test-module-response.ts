/**
 * Script de prueba para verificar el ModuleResponseService
 * Este archivo ayuda a identificar problemas con la creación de respuestas
 */

import { ModuleResponseService } from '../services/moduleResponse.service';

export const testModuleResponseCreation = async () => {
  console.log('🧪 TEST: Verificando creación de respuestas de módulo...');

  try {
    const service = new ModuleResponseService();

    // Datos de prueba
    const testData = {
      researchId: 'test-research-123',
      participantId: 'test-participant-456',
      stepType: 'cognitive_short_text',
      stepTitle: 'Pregunta de prueba',
      questionKey: 'cognitive_task:cognitive_short_text:test-123',
      response: { text: 'Respuesta de prueba' },
      metadata: {
        deviceInfo: {
          deviceType: 'desktop' as const,
          userAgent: 'test-agent',
          screenWidth: 1920,
          screenHeight: 1080,
          platform: 'test-platform',
          language: 'es'
        },
        timingInfo: {
          startTime: Date.now(),
          endTime: Date.now() + 1000
        }
      }
    };

    console.log('📝 Datos de prueba:', testData);

    // Intentar crear la respuesta
    const result = await service.saveModuleResponse(testData);

    console.log('✅ Respuesta creada exitosamente:', {
      id: result.id,
      stepType: result.stepType,
      questionKey: result.questionKey,
      hasResponse: !!result.response
    });

    return result;
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    throw error;
  }
};

// Función para verificar la estructura de la tabla
export const checkTableStructure = async () => {
  console.log('🔍 Verificando estructura de la tabla...');

  try {
    const service = new ModuleResponseService();

    // Intentar una consulta simple para verificar que la tabla existe
    const result = await service.findByResearchAndParticipant('test', 'test');

    console.log('✅ Tabla accesible, estructura válida');
    return true;
  } catch (error: any) {
    console.error('❌ Error de estructura:', error.message);

    if (error.message.includes('Table or index not found')) {
      console.error('💡 Posible solución: Verificar que la tabla ModuleResponses existe y tiene el índice RESEARCH_PARTICIPANT_INDEX');
    }

    return false;
  }
};

// Exportar para uso en otros archivos
export default {
  testModuleResponseCreation,
  checkTableStructure
};
