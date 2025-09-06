/**
 * 🧪 FRONTEND COORDINATE FIDELITY TEST
 * Verifica la precisión de coordenadas en la visualización frontend
 * Complementa las pruebas de public-tests para validación end-to-end
 */

export interface FrontendCoordinateTestResult {
  testId: string;
  timestamp: number;
  originalData: {
    x: number;
    y: number;
    imageIndex: number;
    isCorrect: boolean;
    participantId?: string;
  };
  renderedData: {
    x: number;
    y: number;
    renderedPosition: { left: number; top: number };
    imageContainer: DOMRect;
    imageNaturalSize: { width: number; height: number };
    imageRenderSize: { width: number; height: number };
  };
  accuracy: {
    pixelDifference: number;
    percentageDifference: number;
    isAccurate: boolean;
  };
}

export class FrontendCoordinateFidelityTester {
  private testResults: FrontendCoordinateTestResult[] = [];
  
  /**
   * Inicia un test de fidelidad frontend
   */
  startTest(testId: string): void {
    console.log(`🧪 [Frontend FidelityTest] Starting test: ${testId}`);
    this.testResults = this.testResults.filter(r => r.testId !== testId);
  }

  /**
   * Registra datos originales de un click (como vienen del backend)
   */
  recordOriginalClickData(
    testId: string,
    clickData: {
      x: number;
      y: number;
      imageIndex: number;
      isCorrect: boolean;
      participantId?: string;
    }
  ): void {
    console.log(`🎯 [Frontend FidelityTest] Original data recorded:`, {
      testId,
      originalData: clickData
    });

    // Buscar resultado existente o crear uno nuevo
    let result = this.testResults.find(r => r.testId === testId);
    if (!result) {
      result = {
        testId,
        timestamp: Date.now(),
        originalData: clickData,
        renderedData: {
          x: 0,
          y: 0,
          renderedPosition: { left: 0, top: 0 },
          imageContainer: new DOMRect(),
          imageNaturalSize: { width: 0, height: 0 },
          imageRenderSize: { width: 0, height: 0 }
        },
        accuracy: { pixelDifference: 0, percentageDifference: 0, isAccurate: false }
      };
      this.testResults.push(result);
    } else {
      result.originalData = clickData;
    }
  }

  /**
   * Registra la posición renderizada del click en el DOM
   */
  recordRenderedClick(
    testId: string,
    clickElement: HTMLElement,
    imageContainer: HTMLImageElement,
    imageNaturalSize: { width: number; height: number }
  ): void {
    const result = this.testResults.find(r => r.testId === testId);
    if (!result) {
      console.error(`❌ [Frontend FidelityTest] No original data found for testId: ${testId}`);
      return;
    }

    // Obtener posiciones del DOM
    const clickRect = clickElement.getBoundingClientRect();
    const imageRect = imageContainer.getBoundingClientRect();
    const imageRenderSize = { width: imageContainer.width, height: imageContainer.height };

    // Calcular posición relativa del click dentro de la imagen
    const relativeX = (clickRect.left + clickRect.width / 2) - imageRect.left;
    const relativeY = (clickRect.top + clickRect.height / 2) - imageRect.top;

    result.renderedData = {
      x: relativeX,
      y: relativeY,
      renderedPosition: { left: clickRect.left, top: clickRect.top },
      imageContainer: imageRect,
      imageNaturalSize,
      imageRenderSize
    };

    // Calcular precisión
    const pixelDifference = Math.sqrt(
      Math.pow(result.originalData.x - relativeX, 2) +
      Math.pow(result.originalData.y - relativeY, 2)
    );

    const totalImageArea = imageRenderSize.width * imageRenderSize.height;
    const percentageDifference = (pixelDifference / Math.sqrt(totalImageArea)) * 100;

    result.accuracy = {
      pixelDifference,
      percentageDifference,
      isAccurate: pixelDifference <= 2 // Tolerancia de 2 píxeles
    };

    console.log(`🎯 [Frontend FidelityTest] Rendered click recorded:`, {
      testId,
      originalCoords: { x: result.originalData.x, y: result.originalData.y },
      renderedCoords: { x: relativeX, y: relativeY },
      pixelDifference: pixelDifference.toFixed(2),
      percentageDifference: percentageDifference.toFixed(2),
      isAccurate: result.accuracy.isAccurate
    });
  }

  /**
   * Validación automática de múltiples clicks en una imagen
   */
  validateImageClicks(
    imageContainer: HTMLImageElement,
    clickElements: NodeListOf<Element> | HTMLElement[],
    originalClicksData: Array<{
      x: number;
      y: number;
      imageIndex: number;
      isCorrect: boolean;
      participantId?: string;
    }>,
    imageNaturalSize: { width: number; height: number }
  ): FrontendCoordinateTestResult[] {
    const results: FrontendCoordinateTestResult[] = [];
    const elementsArray = Array.from(clickElements);

    originalClicksData.forEach((clickData, index) => {
      if (index < elementsArray.length) {
        const testId = `frontend-validation-${Date.now()}-${index}`;
        this.startTest(testId);
        this.recordOriginalClickData(testId, clickData);
        this.recordRenderedClick(
          testId,
          elementsArray[index] as HTMLElement,
          imageContainer,
          imageNaturalSize
        );

        const result = this.testResults.find(r => r.testId === testId);
        if (result) {
          results.push(result);
        }
      }
    });

    return results;
  }

  /**
   * Genera reporte de fidelidad frontend
   */
  generateFrontendFidelityReport(): {
    totalTests: number;
    accurateTests: number;
    averagePixelDifference: number;
    accuracyPercentage: number;
    details: FrontendCoordinateTestResult[];
    coordinateScalingIssues: number;
  } {
    const totalTests = this.testResults.length;
    const accurateTests = this.testResults.filter(r => r.accuracy.isAccurate).length;
    const averagePixelDifference = totalTests > 0 
      ? this.testResults.reduce((sum, r) => sum + r.accuracy.pixelDifference, 0) / totalTests 
      : 0;
    const accuracyPercentage = totalTests > 0 ? (accurateTests / totalTests) * 100 : 0;

    // Detectar problemas de escalado de coordenadas
    const coordinateScalingIssues = this.testResults.filter(r => 
      r.accuracy.pixelDifference > 10 // Más de 10 píxeles sugiere problema de escalado
    ).length;

    const report = {
      totalTests,
      accurateTests,
      averagePixelDifference,
      accuracyPercentage,
      details: [...this.testResults],
      coordinateScalingIssues
    };

    console.log(`📊 [Frontend FidelityTest] Final Report:`, report);
    return report;
  }

  /**
   * Obtiene resultados del test
   */
  getTestResults(testId?: string): FrontendCoordinateTestResult[] {
    if (testId) {
      return this.testResults.filter(r => r.testId === testId);
    }
    return [...this.testResults];
  }

  /**
   * Compara con resultados de public-tests
   */
  compareWithPublicTests(publicTestResults: any[]): {
    coordinateDifferences: Array<{
      testId: string;
      publicTestCoords: { x: number; y: number };
      frontendCoords: { x: number; y: number };
      difference: number;
      isConsistent: boolean;
    }>;
    overallConsistency: number;
  } {
    const comparisons = this.testResults.map(frontendResult => {
      // Buscar resultado correspondiente en public-tests
      const publicResult = publicTestResults.find(pr => 
        pr.originalClick.x === frontendResult.originalData.x && 
        pr.originalClick.y === frontendResult.originalData.y
      );

      if (publicResult) {
        const difference = Math.sqrt(
          Math.pow(publicResult.processedClick.x - frontendResult.renderedData.x, 2) +
          Math.pow(publicResult.processedClick.y - frontendResult.renderedData.y, 2)
        );

        return {
          testId: frontendResult.testId,
          publicTestCoords: { x: publicResult.processedClick.x, y: publicResult.processedClick.y },
          frontendCoords: { x: frontendResult.renderedData.x, y: frontendResult.renderedData.y },
          difference,
          isConsistent: difference <= 2 // Tolerancia de 2 píxeles
        };
      }

      return null;
    }).filter(Boolean) as any[];

    const consistentResults = comparisons.filter(c => c.isConsistent).length;
    const overallConsistency = comparisons.length > 0 
      ? (consistentResults / comparisons.length) * 100 
      : 0;

    console.log(`🔄 [Frontend FidelityTest] Public-Tests Comparison:`, {
      totalComparisons: comparisons.length,
      consistentResults,
      overallConsistency: `${overallConsistency.toFixed(2)}%`
    });

    return {
      coordinateDifferences: comparisons,
      overallConsistency
    };
  }

  /**
   * Exporta resultados como JSON
   */
  exportResults(): string {
    const report = this.generateFrontendFidelityReport();
    const exportData = {
      timestamp: new Date().toISOString(),
      type: 'frontend-coordinate-fidelity-test',
      report,
      rawResults: this.testResults
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    
    // Crear descarga automática
    if (typeof window !== 'undefined' && window.document) {
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `frontend-coordinate-fidelity-test-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }

    return dataStr;
  }

  /**
   * Limpia todos los resultados
   */
  clearResults(): void {
    this.testResults = [];
    console.log(`🗑️ [Frontend FidelityTest] All results cleared`);
  }
}

// Instancia global del tester frontend
export const frontendCoordinateFidelityTester = new FrontendCoordinateFidelityTester();

/**
 * Utility function para inyectar capacidades de test en el window global
 */
export const injectFrontendFidelityTest = () => {
  if (typeof window !== 'undefined') {
    (window as any).frontendCoordinateFidelityTester = frontendCoordinateFidelityTester;
    console.log('🧪 [Frontend FidelityTest] Frontend test utilities injected to window.frontendCoordinateFidelityTester');
  }
};

/**
 * Hook React para usar el tester de fidelidad
 */
export const useFrontendFidelityTest = () => {
  return {
    tester: frontendCoordinateFidelityTester,
    startTest: frontendCoordinateFidelityTester.startTest.bind(frontendCoordinateFidelityTester),
    recordOriginalClickData: frontendCoordinateFidelityTester.recordOriginalClickData.bind(frontendCoordinateFidelityTester),
    recordRenderedClick: frontendCoordinateFidelityTester.recordRenderedClick.bind(frontendCoordinateFidelityTester),
    validateImageClicks: frontendCoordinateFidelityTester.validateImageClicks.bind(frontendCoordinateFidelityTester),
    generateReport: frontendCoordinateFidelityTester.generateFrontendFidelityReport.bind(frontendCoordinateFidelityTester),
    exportResults: frontendCoordinateFidelityTester.exportResults.bind(frontendCoordinateFidelityTester),
    clearResults: frontendCoordinateFidelityTester.clearResults.bind(frontendCoordinateFidelityTester)
  };
};