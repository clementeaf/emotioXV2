/**
 * Utilidad para probar el endpoint de respuestas agrupadas
 */

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  url: string;
  timestamp: string;
}

/**
 * Prueba el endpoint de respuestas agrupadas
 */
export async function testGroupedResponsesEndpoint(
  baseUrl: string,
  researchId: string
): Promise<TestResult> {
  const url = `${baseUrl}/module-responses/grouped-by-question/${researchId}`;
  const timestamp = new Date().toISOString();

  try {
    console.log(`🧪 Probando endpoint: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Verificar estructura de respuesta
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Respuesta no tiene la estructura esperada (data.data debe ser un array)');
    }

    // Verificar que cada pregunta tiene la estructura correcta
    const validStructure = data.data.every((question: any) => {
      return question.questionKey &&
        Array.isArray(question.responses) &&
        question.responses.every((response: any) =>
          response.participantId &&
          response.value !== undefined &&
          response.timestamp
        );
    });

    if (!validStructure) {
      throw new Error('Estructura de respuestas inválida');
    }

    console.log(`✅ Endpoint funcionando correctamente`);
    console.log(`📊 Total preguntas: ${data.data.length}`);
    console.log(`👥 Total participantes únicos: ${new Set(data.data.flatMap((q: any) => q.responses.map((r: any) => r.participantId))).size}`);

    return {
      success: true,
      message: 'Endpoint funcionando correctamente',
      data: data,
      url,
      timestamp
    };

  } catch (error) {
    console.error(`❌ Error probando endpoint:`, error);

    return {
      success: false,
      message: 'Error probando endpoint',
      error: error instanceof Error ? error.message : 'Error desconocido',
      url,
      timestamp
    };
  }
}

/**
 * Compara el rendimiento entre el endpoint original y el nuevo
 */
export async function compareEndpoints(
  baseUrl: string,
  researchId: string
): Promise<{
  original: TestResult;
  grouped: TestResult;
  comparison: {
    originalTime: number;
    groupedTime: number;
    improvement: number;
  };
}> {
  console.log('🔄 Comparando rendimiento de endpoints...');

  // Probar endpoint original
  const originalStart = Date.now();
  const originalUrl = `${baseUrl}/module-responses/research/${researchId}`;
  const originalResponse = await fetch(originalUrl);
  const originalData = await originalResponse.json();
  const originalTime = Date.now() - originalStart;

  // Probar endpoint agrupado
  const groupedStart = Date.now();
  const groupedResult = await testGroupedResponsesEndpoint(baseUrl, researchId);
  const groupedTime = Date.now() - groupedStart;

  const improvement = originalTime > 0 ? ((originalTime - groupedTime) / originalTime) * 100 : 0;

  return {
    original: {
      success: originalResponse.ok,
      message: originalResponse.ok ? 'Endpoint original funcionando' : 'Error en endpoint original',
      data: originalData,
      url: originalUrl,
      timestamp: new Date().toISOString()
    },
    grouped: groupedResult,
    comparison: {
      originalTime,
      groupedTime,
      improvement
    }
  };
}

/**
 * Genera un reporte de prueba
 */
export function generateTestReport(results: {
  original: TestResult;
  grouped: TestResult;
  comparison: {
    originalTime: number;
    groupedTime: number;
    improvement: number;
  };
}): string {
  const { original, grouped, comparison } = results;

  return `
# 📊 Reporte de Prueba - Endpoints de Respuestas

## ✅ Resultados

### Endpoint Original
- **URL**: ${original.url}
- **Estado**: ${original.success ? '✅ Funcionando' : '❌ Error'}
- **Tiempo**: ${comparison.originalTime}ms
- **Mensaje**: ${original.message}

### Endpoint Agrupado (Nuevo)
- **URL**: ${grouped.url}
- **Estado**: ${grouped.success ? '✅ Funcionando' : '❌ Error'}
- **Tiempo**: ${comparison.groupedTime}ms
- **Mensaje**: ${grouped.message}

## 📈 Comparación de Rendimiento

- **Tiempo original**: ${comparison.originalTime}ms
- **Tiempo agrupado**: ${comparison.groupedTime}ms
- **Mejora**: ${comparison.improvement.toFixed(2)}% ${comparison.improvement > 0 ? 'más rápido' : 'más lento'}

## 🎯 Conclusión

${grouped.success
      ? '✅ El nuevo endpoint está funcionando correctamente y proporciona una estructura más eficiente para análisis estadísticos.'
      : '❌ El nuevo endpoint tiene problemas que necesitan ser resueltos.'
    }

${comparison.improvement > 0
      ? `🚀 El endpoint agrupado es ${comparison.improvement.toFixed(2)}% más rápido que el original.`
      : `⚠️ El endpoint agrupado es ${Math.abs(comparison.improvement).toFixed(2)}% más lento que el original.`
    }
  `.trim();
}
