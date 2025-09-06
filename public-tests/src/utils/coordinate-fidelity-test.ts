/**
 * 🧪 COORDINATE FIDELITY TEST
 * Verifica la precisión de coordenadas entre captura y visualización
 */

export interface CoordinateTestResult {
  testId: string;
  timestamp: number;
  originalClick: {
    x: number;
    y: number;
    imageNaturalSize: { width: number; height: number };
    imageRenderSize: { width: number; height: number };
    imageOffset: { x: number; y: number };
    containerBounds: DOMRect;
  };
  processedClick: {
    x: number;
    y: number;
    isCorrect: boolean;
    imageIndex: number;
  };
  accuracy: {
    pixelDifference: number;
    percentageDifference: number;
    isAccurate: boolean;
  };
}

export class CoordinateFidelityTester {
  private testResults: CoordinateTestResult[] = [];
  
  /**
   * Inicia un test de fidelidad de coordenadas
   */
  startTest(testId: string): void {
    console.log(`🧪 [FidelityTest] Starting test: ${testId}`);
    this.testResults = this.testResults.filter(r => r.testId !== testId);
  }

  /**
   * Registra un click original (momento de captura)
   */
  recordOriginalClick(
    testId: string,
    clickEvent: MouseEvent,
    imageRef: HTMLImageElement,
    imageNaturalSize: { width: number; height: number },
    imageRenderSize: { width: number; height: number }
  ): void {
    const imgRect = imageRef.getBoundingClientRect();
    const clickX = clickEvent.clientX - imgRect.left;
    const clickY = clickEvent.clientY - imgRect.top;

    console.log(`🎯 [FidelityTest] Original click recorded:`, {
      testId,
      rawCoordinates: { x: clickEvent.clientX, y: clickEvent.clientY },
      imageRelative: { x: clickX, y: clickY },
      imageBounds: imgRect,
      naturalSize: imageNaturalSize,
      renderSize: imageRenderSize
    });

    // Calcular offset de imagen dentro del contenedor
    const imgRatio = imageNaturalSize.width / imageNaturalSize.height;
    const renderRatio = imageRenderSize.width / imageRenderSize.height;
    
    let drawWidth = imageRenderSize.width;
    let drawHeight = imageRenderSize.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (imgRatio > renderRatio) {
      drawWidth = imageRenderSize.width;
      drawHeight = imageRenderSize.width / imgRatio;
      offsetY = (imageRenderSize.height - drawHeight) / 2;
    } else {
      drawHeight = imageRenderSize.height;
      drawWidth = imageRenderSize.height * imgRatio;
      offsetX = (imageRenderSize.width - drawWidth) / 2;
    }

    const originalClick = {
      x: clickX,
      y: clickY,
      imageNaturalSize,
      imageRenderSize,
      imageOffset: { x: offsetX, y: offsetY },
      containerBounds: imgRect
    };

    // Buscar resultado existente o crear uno nuevo
    let result = this.testResults.find(r => r.testId === testId);
    if (!result) {
      result = {
        testId,
        timestamp: Date.now(),
        originalClick,
        processedClick: { x: 0, y: 0, isCorrect: false, imageIndex: 0 },
        accuracy: { pixelDifference: 0, percentageDifference: 0, isAccurate: false }
      };
      this.testResults.push(result);
    } else {
      result.originalClick = originalClick;
    }
  }

  /**
   * Registra un click procesado (datos que se guardan)
   */
  recordProcessedClick(
    testId: string,
    visualClickPoint: {
      x: number;
      y: number;
      isCorrect: boolean;
      imageIndex: number;
    }
  ): void {
    console.log(`📊 [FidelityTest] Processed click recorded:`, {
      testId,
      processedCoordinates: visualClickPoint
    });

    const result = this.testResults.find(r => r.testId === testId);
    if (!result) {
      console.error(`❌ [FidelityTest] No original click found for testId: ${testId}`);
      return;
    }

    result.processedClick = visualClickPoint;

    // Calcular precisión
    const pixelDifference = Math.sqrt(
      Math.pow(result.originalClick.x - visualClickPoint.x, 2) +
      Math.pow(result.originalClick.y - visualClickPoint.y, 2)
    );

    const totalImageArea = result.originalClick.imageRenderSize.width * result.originalClick.imageRenderSize.height;
    const percentageDifference = (pixelDifference / Math.sqrt(totalImageArea)) * 100;

    result.accuracy = {
      pixelDifference,
      percentageDifference,
      isAccurate: pixelDifference <= 2 // Tolerancia de 2 píxeles
    };

    console.log(`🎯 [FidelityTest] Accuracy calculated:`, {
      testId,
      pixelDifference: pixelDifference.toFixed(2),
      percentageDifference: percentageDifference.toFixed(2),
      isAccurate: result.accuracy.isAccurate
    });
  }

  /**
   * Obtiene los resultados del test
   */
  getTestResults(testId?: string): CoordinateTestResult[] {
    if (testId) {
      return this.testResults.filter(r => r.testId === testId);
    }
    return [...this.testResults];
  }

  /**
   * Genera un reporte completo de fidelidad
   */
  generateFidelityReport(): {
    totalTests: number;
    accurateTests: number;
    averagePixelDifference: number;
    accuracyPercentage: number;
    details: CoordinateTestResult[];
  } {
    const totalTests = this.testResults.length;
    const accurateTests = this.testResults.filter(r => r.accuracy.isAccurate).length;
    const averagePixelDifference = totalTests > 0 
      ? this.testResults.reduce((sum, r) => sum + r.accuracy.pixelDifference, 0) / totalTests 
      : 0;
    const accuracyPercentage = totalTests > 0 ? (accurateTests / totalTests) * 100 : 0;

    const report = {
      totalTests,
      accurateTests,
      averagePixelDifference,
      accuracyPercentage,
      details: [...this.testResults]
    };

    console.log(`📊 [FidelityTest] Final Report:`, report);
    return report;
  }

  /**
   * Exporta los resultados como JSON para análisis
   */
  exportResults(): string {
    const report = this.generateFidelityReport();
    const exportData = {
      timestamp: new Date().toISOString(),
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
      link.download = `coordinate-fidelity-test-${Date.now()}.json`;
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
    console.log(`🗑️ [FidelityTest] All results cleared`);
  }
}

// Instancia global del tester
export const coordinateFidelityTester = new CoordinateFidelityTester();

/**
 * Utility function to inject test capabilities into NavigationFlowTask
 */
export const injectFidelityTest = () => {
  if (typeof window !== 'undefined') {
    (window as any).coordinateFidelityTester = coordinateFidelityTester;
    console.log('🧪 [FidelityTest] Test utilities injected to window.coordinateFidelityTester');
  }
};