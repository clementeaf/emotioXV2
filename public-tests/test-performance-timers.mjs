#!/usr/bin/env node

/**
 * TEST DE RENDIMIENTO PARA TIMERS MÚLTIPLES
 *
 * Este script valida el rendimiento del sistema cuando se ejecutan múltiples
 * temporizadores simultáneamente, simulando escenarios reales de uso.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-performance-timers';
const PARTICIPANT_ID = 'test-performance-participant';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}============================================================`);
  console.log(`⏱️  ${title}`);
  console.log(`============================================================${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'reset');
  }
}

function logMetric(metric, value, unit = '') {
  log(`📊 ${metric}: ${value}${unit}`, 'blue');
}

// ============================================================================
// TEST 1: TIMERS SECUENCIALES
// ============================================================================

async function testSequentialTimers() {
  logSection('TEST 1: TIMERS SECUENCIALES');

  const timerCount = 10;
  const timerDuration = 100; // ms
  const results = [];

  log(`🔄 Ejecutando ${timerCount} timers secuenciales de ${timerDuration}ms cada uno...`);

  const startTime = Date.now();

  for (let i = 0; i < timerCount; i++) {
    const timerStart = Date.now();

    // Simular timer
    await new Promise(resolve => setTimeout(resolve, timerDuration));

    const timerEnd = Date.now();
    const actualDuration = timerEnd - timerStart;
    const deviation = Math.abs(actualDuration - timerDuration);

    results.push({
      timer: i + 1,
      expected: timerDuration,
      actual: actualDuration,
      deviation: deviation,
      percentage: (deviation / timerDuration) * 100
    });

    // Enviar datos al backend cada 3 timers
    if ((i + 1) % 3 === 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/module-responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            researchId: RESEARCH_ID,
            participantId: `${PARTICIPANT_ID}-sequential-${i}`,
            stepType: 'performance',
            stepTitle: `Timer Secuencial ${i + 1}`,
            response: {
              timerIndex: i + 1,
              duration: actualDuration,
              deviation: deviation
            },
            metadata: {
              deviceInfo: { deviceType: 'desktop' },
              timingInfo: {
                startTime: timerStart,
                endTime: timerEnd,
                duration: actualDuration
              },
              sessionInfo: { reentryCount: 0, isFirstVisit: true },
              technicalInfo: { browser: 'Chrome' }
            }
          })
        });

        if (response.status === 201) {
          log(`   📤 Timer ${i + 1} enviado al backend`, 'green');
        }
      } catch (error) {
        log(`   ❌ Error enviando timer ${i + 1}: ${error.message}`, 'red');
      }
    }
  }

  const totalTime = Date.now() - startTime;
  const expectedTotalTime = timerCount * timerDuration;
  const totalDeviation = Math.abs(totalTime - expectedTotalTime);

  // Análisis de resultados
  const avgDeviation = results.reduce((sum, r) => sum + r.deviation, 0) / results.length;
  const maxDeviation = Math.max(...results.map(r => r.deviation));
  const minDeviation = Math.min(...results.map(r => r.deviation));
  const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

  logTest('Timers secuenciales completados', true, `${timerCount} timers ejecutados`);
  logMetric('Tiempo total', totalTime, 'ms');
  logMetric('Tiempo esperado', expectedTotalTime, 'ms');
  logMetric('Desviación total', totalDeviation, 'ms');
  logMetric('Desviación promedio', avgDeviation.toFixed(2), 'ms');
  logMetric('Desviación máxima', maxDeviation, 'ms');
  logMetric('Desviación mínima', minDeviation, 'ms');
  logMetric('Error promedio', avgPercentage.toFixed(2), '%');

  return {
    success: avgPercentage < 10, // Aceptar hasta 10% de error
    metrics: {
      totalTime,
      expectedTotalTime,
      totalDeviation,
      avgDeviation,
      maxDeviation,
      minDeviation,
      avgPercentage
    }
  };
}

// ============================================================================
// TEST 2: TIMERS PARALELOS
// ============================================================================

async function testParallelTimers() {
  logSection('TEST 2: TIMERS PARALELOS');

  const timerCount = 20;
  const timerDuration = 200; // ms
  const results = [];

  log(`🔄 Ejecutando ${timerCount} timers en paralelo de ${timerDuration}ms cada uno...`);

  const startTime = Date.now();

  // Crear todos los timers simultáneamente
  const timerPromises = Array.from({ length: timerCount }, async (_, i) => {
    const timerStart = Date.now();

    // Simular timer
    await new Promise(resolve => setTimeout(resolve, timerDuration));

    const timerEnd = Date.now();
    const actualDuration = timerEnd - timerStart;
    const deviation = Math.abs(actualDuration - timerDuration);

    return {
      timer: i + 1,
      expected: timerDuration,
      actual: actualDuration,
      deviation: deviation,
      percentage: (deviation / timerDuration) * 100,
      startTime: timerStart,
      endTime: timerEnd
    };
  });

  // Ejecutar todos los timers en paralelo
  const timerResults = await Promise.all(timerPromises);
  results.push(...timerResults);

  const totalTime = Date.now() - startTime;
  const expectedTotalTime = timerDuration; // En paralelo, debería ser ~timerDuration
  const totalDeviation = Math.abs(totalTime - expectedTotalTime);

  // Análisis de resultados
  const avgDeviation = results.reduce((sum, r) => sum + r.deviation, 0) / results.length;
  const maxDeviation = Math.max(...results.map(r => r.deviation));
  const minDeviation = Math.min(...results.map(r => r.deviation));
  const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

  // Verificar que los timers realmente se ejecutaron en paralelo
  const parallelEfficiency = (expectedTotalTime / totalTime) * 100;

  logTest('Timers paralelos completados', true, `${timerCount} timers ejecutados`);
  logMetric('Tiempo total', totalTime, 'ms');
  logMetric('Tiempo esperado (paralelo)', expectedTotalTime, 'ms');
  logMetric('Eficiencia paralela', parallelEfficiency.toFixed(2), '%');
  logMetric('Desviación promedio', avgDeviation.toFixed(2), 'ms');
  logMetric('Desviación máxima', maxDeviation, 'ms');
  logMetric('Desviación mínima', minDeviation, 'ms');
  logMetric('Error promedio', avgPercentage.toFixed(2), '%');

  // Enviar resultados al backend
  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        researchId: RESEARCH_ID,
        participantId: `${PARTICIPANT_ID}-parallel`,
        stepType: 'performance',
        stepTitle: 'Timers Paralelos',
        response: {
          timerCount,
          totalTime,
          parallelEfficiency,
          avgDeviation,
          maxDeviation
        },
        metadata: {
          deviceInfo: { deviceType: 'desktop' },
          timingInfo: {
            startTime: startTime,
            endTime: Date.now(),
            duration: totalTime
          },
          sessionInfo: { reentryCount: 0, isFirstVisit: true },
          technicalInfo: { browser: 'Chrome' }
        }
      })
    });

    if (response.status === 201) {
      logTest('Datos enviados al backend', true, 'Resultados de timers paralelos guardados');
    }
  } catch (error) {
    logTest('Datos enviados al backend', false, `Error: ${error.message}`);
  }

  return {
    success: parallelEfficiency > 80 && avgPercentage < 15, // Eficiencia > 80% y error < 15%
    metrics: {
      totalTime,
      expectedTotalTime,
      parallelEfficiency,
      avgDeviation,
      maxDeviation,
      minDeviation,
      avgPercentage
    }
  };
}

// ============================================================================
// TEST 3: TIMERS CON DIFERENTES DURACIONES
// ============================================================================

async function testMixedDurationTimers() {
  logSection('TEST 3: TIMERS CON DIFERENTES DURACIONES');

  const timers = [
    { id: 1, duration: 50, name: 'Corto' },
    { id: 2, duration: 100, name: 'Medio' },
    { id: 3, duration: 200, name: 'Largo' },
    { id: 4, duration: 500, name: 'Muy Largo' },
    { id: 5, duration: 1000, name: 'Extremo' }
  ];

  const results = [];

  log(`🔄 Ejecutando ${timers.length} timers con diferentes duraciones...`);

  const startTime = Date.now();

  // Ejecutar timers en paralelo con diferentes duraciones
  const timerPromises = timers.map(async (timer) => {
    const timerStart = Date.now();

    // Simular timer
    await new Promise(resolve => setTimeout(resolve, timer.duration));

    const timerEnd = Date.now();
    const actualDuration = timerEnd - timerStart;
    const deviation = Math.abs(actualDuration - timer.duration);

    return {
      ...timer,
      expected: timer.duration,
      actual: actualDuration,
      deviation: deviation,
      percentage: (deviation / timer.duration) * 100,
      startTime: timerStart,
      endTime: timerEnd
    };
  });

  const timerResults = await Promise.all(timerPromises);
  results.push(...timerResults);

  const totalTime = Date.now() - startTime;
  const expectedTotalTime = Math.max(...timers.map(t => t.duration)); // Debería ser ~duración del timer más largo

  // Análisis por categoría de duración
  const shortTimers = results.filter(r => r.duration <= 100);
  const mediumTimers = results.filter(r => r.duration > 100 && r.duration <= 300);
  const longTimers = results.filter(r => r.duration > 300);

  logTest('Timers mixtos completados', true, `${timers.length} timers ejecutados`);
  logMetric('Tiempo total', totalTime, 'ms');
  logMetric('Tiempo esperado', expectedTotalTime, 'ms');

  // Mostrar resultados por categoría
  log('\n📊 RESULTADOS POR CATEGORÍA:');

  shortTimers.forEach(timer => {
    logTest(`Timer ${timer.name} (${timer.duration}ms)`, timer.percentage < 10,
      `Esperado: ${timer.expected}ms | Actual: ${timer.actual}ms | Error: ${timer.percentage.toFixed(2)}%`);
  });

  mediumTimers.forEach(timer => {
    logTest(`Timer ${timer.name} (${timer.duration}ms)`, timer.percentage < 10,
      `Esperado: ${timer.expected}ms | Actual: ${timer.actual}ms | Error: ${timer.percentage.toFixed(2)}%`);
  });

  longTimers.forEach(timer => {
    logTest(`Timer ${timer.name} (${timer.duration}ms)`, timer.percentage < 10,
      `Esperado: ${timer.expected}ms | Actual: ${timer.actual}ms | Error: ${timer.percentage.toFixed(2)}%`);
  });

  const allAccurate = results.every(r => r.percentage < 10);

  return {
    success: allAccurate,
    metrics: {
      totalTime,
      expectedTotalTime,
      results: results.map(r => ({
        name: r.name,
        expected: r.expected,
        actual: r.actual,
        percentage: r.percentage
      }))
    }
  };
}

// ============================================================================
// TEST 4: STRESS TEST - MÚLTIPLES TIMERS SIMULTÁNEOS
// ============================================================================

async function testStressTimers() {
  logSection('TEST 4: STRESS TEST - MÚLTIPLES TIMERS SIMULTÁNEOS');

  const timerCount = 50;
  const timerDuration = 100;
  const batchSize = 10;
  const results = [];

  log(`🔄 Ejecutando stress test con ${timerCount} timers en lotes de ${batchSize}...`);

  const startTime = Date.now();
  let completedTimers = 0;

  // Ejecutar timers en lotes para evitar sobrecarga
  for (let batch = 0; batch < Math.ceil(timerCount / batchSize); batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min((batch + 1) * batchSize, timerCount);
    const currentBatchSize = batchEnd - batchStart;

    log(`   📦 Lote ${batch + 1}: ${currentBatchSize} timers...`);

    const batchPromises = Array.from({ length: currentBatchSize }, async (_, i) => {
      const timerIndex = batchStart + i;
      const timerStart = Date.now();

      // Simular timer
      await new Promise(resolve => setTimeout(resolve, timerDuration));

      const timerEnd = Date.now();
      const actualDuration = timerEnd - timerStart;
      const deviation = Math.abs(actualDuration - timerDuration);

      completedTimers++;

      return {
        timer: timerIndex + 1,
        batch: batch + 1,
        expected: timerDuration,
        actual: actualDuration,
        deviation: deviation,
        percentage: (deviation / timerDuration) * 100,
        startTime: timerStart,
        endTime: timerEnd
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Pequeña pausa entre lotes para evitar sobrecarga
    if (batch < Math.ceil(timerCount / batchSize) - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  const totalTime = Date.now() - startTime;
  const expectedTotalTime = Math.ceil(timerCount / batchSize) * timerDuration + (Math.ceil(timerCount / batchSize) - 1) * 50;

  // Análisis de resultados
  const avgDeviation = results.reduce((sum, r) => sum + r.deviation, 0) / results.length;
  const maxDeviation = Math.max(...results.map(r => r.deviation));
  const minDeviation = Math.min(...results.map(r => r.deviation));
  const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

  // Verificar estabilidad del sistema
  const stableTimers = results.filter(r => r.percentage < 20).length;
  const stabilityRate = (stableTimers / results.length) * 100;

  logTest('Stress test completado', true, `${timerCount} timers ejecutados en lotes`);
  logMetric('Tiempo total', totalTime, 'ms');
  logMetric('Tiempo esperado', expectedTotalTime, 'ms');
  logMetric('Timers estables', stableTimers, `/${timerCount}`);
  logMetric('Tasa de estabilidad', stabilityRate.toFixed(2), '%');
  logMetric('Desviación promedio', avgDeviation.toFixed(2), 'ms');
  logMetric('Desviación máxima', maxDeviation, 'ms');
  logMetric('Error promedio', avgPercentage.toFixed(2), '%');

  // Enviar resultados al backend
  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        researchId: RESEARCH_ID,
        participantId: `${PARTICIPANT_ID}-stress`,
        stepType: 'performance',
        stepTitle: 'Stress Test Timers',
        response: {
          timerCount,
          totalTime,
          stabilityRate,
          avgDeviation,
          maxDeviation,
          completedTimers
        },
        metadata: {
          deviceInfo: { deviceType: 'desktop' },
          timingInfo: {
            startTime: startTime,
            endTime: Date.now(),
            duration: totalTime
          },
          sessionInfo: { reentryCount: 0, isFirstVisit: true },
          technicalInfo: { browser: 'Chrome' }
        }
      })
    });

    if (response.status === 201) {
      logTest('Datos enviados al backend', true, 'Resultados de stress test guardados');
    }
  } catch (error) {
    logTest('Datos enviados al backend', false, `Error: ${error.message}`);
  }

  return {
    success: stabilityRate > 90 && avgPercentage < 20, // 90% de estabilidad y error < 20%
    metrics: {
      totalTime,
      expectedTotalTime,
      stabilityRate,
      avgDeviation,
      maxDeviation,
      minDeviation,
      avgPercentage,
      completedTimers
    }
  };
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function runPerformanceTimerTests() {
  const startTime = Date.now();

  log(`${colors.bright}⏱️  INICIANDO TESTS DE RENDIMIENTO PARA TIMERS MÚLTIPLES${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}\n`);

  // Ejecutar todos los tests
  const results = {
    sequential: await testSequentialTimers(),
    parallel: await testParallelTimers(),
    mixed: await testMixedDurationTimers(),
    stress: await testStressTimers()
  };

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  // Resumen final
  log(`\n${colors.bright}================================================================================${colors.reset}`);
  log(`${colors.bright}📋 RESUMEN DE TESTS DE RENDIMIENTO PARA TIMERS${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}`);
  log(`⏱️  Duración total: ${totalDuration}ms`);

  log(`\n${colors.blue}📊 RESULTADOS POR TEST:${colors.reset}`);
  logTest('Timers Secuenciales', results.sequential.success,
    results.sequential.success ? 'Rendimiento aceptable' : 'Rendimiento degradado');
  logTest('Timers Paralelos', results.parallel.success,
    results.parallel.success ? 'Paralelismo eficiente' : 'Paralelismo ineficiente');
  logTest('Timers Mixtos', results.mixed.success,
    results.mixed.success ? 'Precisión consistente' : 'Precisión variable');
  logTest('Stress Test', results.stress.success,
    results.stress.success ? 'Sistema estable' : 'Sistema inestable');

  // Métricas agregadas
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.success).length;
  const successRate = (passedTests / totalTests) * 100;

  log(`\n${colors.blue}📈 MÉTRICAS AGREGADAS:${colors.reset}`);
  logMetric('Tests pasados', `${passedTests}/${totalTests}`);
  logMetric('Tasa de éxito', successRate.toFixed(2), '%');
  logMetric('Tiempo total de ejecución', totalDuration, 'ms');

  if (successRate >= 75) {
    log(`\n${colors.green}🎉 ¡TESTS DE RENDIMIENTO PARA TIMERS EXITOSOS! El sistema maneja múltiples temporizadores correctamente.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  ALGUNOS TESTS FALLARON. Revisar el rendimiento del sistema con múltiples timers.${colors.reset}`);
  }

  log(`\n${colors.bright}================================================================================${colors.reset}`);

  return successRate >= 75;
}

// Ejecutar tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTimerTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error ejecutando tests de rendimiento:', error);
      process.exit(1);
    });
}

export { runPerformanceTimerTests };
