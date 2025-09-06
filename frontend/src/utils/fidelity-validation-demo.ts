/**
 * 🧪 FIDELITY VALIDATION DEMO SCRIPT
 * Demonstrates the coordinate fidelity testing system
 * Use this to verify 100% precision between public-tests and frontend
 */

import { frontendCoordinateFidelityTester } from './coordinate-fidelity-test';

export interface ValidationDemoResult {
  success: boolean;
  summary: {
    totalTests: number;
    accurateTests: number;
    accuracyPercentage: number;
    averagePixelDifference: number;
  };
  issues: string[];
  recommendations: string[];
}

/**
 * Demonstrates fidelity testing with mock data
 */
export function runFidelityDemo(): ValidationDemoResult {
  console.log('🧪 [FidelityDemo] Starting validation demonstration...');
  
  // Clear any existing results
  frontendCoordinateFidelityTester.clearResults();
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Mock validation scenarios
    const mockScenarios = [
      {
        name: 'Perfect Precision',
        originalClick: { x: 100, y: 150, imageIndex: 0, isCorrect: true },
        renderedPosition: { x: 100, y: 150 } // Exact match
      },
      {
        name: 'Acceptable Tolerance',
        originalClick: { x: 200, y: 250, imageIndex: 0, isCorrect: false },
        renderedPosition: { x: 201, y: 251 } // 1.4px difference (within tolerance)
      },
      {
        name: 'Edge Case - Large Coordinates',
        originalClick: { x: 800, y: 600, imageIndex: 1, isCorrect: true },
        renderedPosition: { x: 799, y: 601 } // 1.4px difference
      },
      {
        name: 'Scaling Issue Example',
        originalClick: { x: 400, y: 300, imageIndex: 1, isCorrect: true },
        renderedPosition: { x: 410, y: 305 } // 11.2px difference (problematic)
      }
    ];
    
    // Simulate testing scenarios
    mockScenarios.forEach((scenario, index) => {
      const testId = `demo-test-${index}-${Date.now()}`;
      
      console.log(`🧪 [FidelityDemo] Testing scenario: ${scenario.name}`);
      
      // Record original data
      frontendCoordinateFidelityTester.startTest(testId);
      frontendCoordinateFidelityTester.recordOriginalClickData(testId, {
        x: scenario.originalClick.x,
        y: scenario.originalClick.y,
        imageIndex: scenario.originalClick.imageIndex,
        isCorrect: scenario.originalClick.isCorrect,
        participantId: `demo-participant-${index}`
      });
      
      // Simulate rendered position recording
      const mockImageContainer = {
        width: 800,
        height: 600,
        naturalWidth: 1600,
        naturalHeight: 1200
      };
      
      // Calculate pixel difference manually for demo
      const pixelDiff = Math.sqrt(
        Math.pow(scenario.originalClick.x - scenario.renderedPosition.x, 2) +
        Math.pow(scenario.originalClick.y - scenario.renderedPosition.y, 2)
      );
      
      console.log(`  📏 Pixel difference: ${pixelDiff.toFixed(2)}px`);
      
      if (pixelDiff > 2) {
        issues.push(`${scenario.name}: High pixel difference (${pixelDiff.toFixed(2)}px)`);
      }
      
      if (pixelDiff > 10) {
        recommendations.push(`${scenario.name}: Check coordinate scaling - difference suggests systematic issue`);
      }
    });
    
    // Generate comprehensive report
    const report = {
      totalTests: mockScenarios.length,
      accurateTests: mockScenarios.filter(s => {
        const diff = Math.sqrt(
          Math.pow(s.originalClick.x - s.renderedPosition.x, 2) +
          Math.pow(s.originalClick.y - s.renderedPosition.y, 2)
        );
        return diff <= 2;
      }).length,
      averagePixelDifference: mockScenarios.reduce((sum, s) => {
        const diff = Math.sqrt(
          Math.pow(s.originalClick.x - s.renderedPosition.x, 2) +
          Math.pow(s.originalClick.y - s.renderedPosition.y, 2)
        );
        return sum + diff;
      }, 0) / mockScenarios.length,
      accuracyPercentage: 0
    };
    
    report.accuracyPercentage = (report.accurateTests / report.totalTests) * 100;
    
    // Add general recommendations based on results
    if (report.accuracyPercentage < 95) {
      recommendations.push('Overall accuracy is below 95% - review coordinate transformation logic');
    }
    
    if (report.averagePixelDifference > 2) {
      recommendations.push('Average pixel difference exceeds tolerance - investigate scaling issues');
    }
    
    if (issues.length === 0) {
      console.log('✅ [FidelityDemo] All scenarios passed fidelity tests!');
    } else {
      console.log('⚠️ [FidelityDemo] Some issues detected:', issues);
    }
    
    console.log('📊 [FidelityDemo] Final Report:', report);
    
    return {
      success: issues.length === 0,
      summary: report,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ [FidelityDemo] Error during demonstration:', error);
    return {
      success: false,
      summary: { totalTests: 0, accurateTests: 0, accuracyPercentage: 0, averagePixelDifference: 0 },
      issues: [`Demonstration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Check console for detailed error information']
    };
  }
}

/**
 * Validates real-world data if available
 */
export function validateRealWorldData(
  imageElement: HTMLImageElement,
  clickPoints: Array<{x: number, y: number, imageIndex: number, isCorrect: boolean}>,
  renderedElements: HTMLElement[]
): ValidationDemoResult {
  console.log('🧪 [FidelityDemo] Validating real-world data...');
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    if (!imageElement) {
      issues.push('No image element provided for validation');
      return { success: false, summary: { totalTests: 0, accurateTests: 0, accuracyPercentage: 0, averagePixelDifference: 0 }, issues, recommendations };
    }
    
    if (clickPoints.length === 0) {
      issues.push('No click points provided for validation');
      return { success: false, summary: { totalTests: 0, accurateTests: 0, accuracyPercentage: 0, averagePixelDifference: 0 }, issues, recommendations };
    }
    
    if (renderedElements.length !== clickPoints.length) {
      issues.push(`Mismatch between click points (${clickPoints.length}) and rendered elements (${renderedElements.length})`);
    }
    
    // Perform actual validation using the fidelity tester
    const results = frontendCoordinateFidelityTester.validateImageClicks(
      imageElement,
      renderedElements,
      clickPoints,
      { width: imageElement.naturalWidth, height: imageElement.naturalHeight }
    );
    
    const report = frontendCoordinateFidelityTester.generateFrontendFidelityReport();
    
    console.log('📊 [FidelityDemo] Real-world validation report:', report);
    
    // Analyze results
    if (report.coordinateScalingIssues > 0) {
      issues.push(`${report.coordinateScalingIssues} clicks have scaling issues (>10px difference)`);
      recommendations.push('Review image scaling and coordinate transformation logic');
    }
    
    if (report.accuracyPercentage < 95) {
      issues.push(`Low accuracy percentage: ${report.accuracyPercentage.toFixed(1)}%`);
      recommendations.push('Investigate systematic coordinate precision issues');
    }
    
    return {
      success: issues.length === 0,
      summary: {
        totalTests: report.totalTests,
        accurateTests: report.accurateTests,
        accuracyPercentage: report.accuracyPercentage,
        averagePixelDifference: report.averagePixelDifference
      },
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ [FidelityDemo] Error during real-world validation:', error);
    return {
      success: false,
      summary: { totalTests: 0, accurateTests: 0, accuracyPercentage: 0, averagePixelDifference: 0 },
      issues: [`Real-world validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Check console for detailed error information']
    };
  }
}

/**
 * Injects demo functions into global window for easy testing
 */
export function injectDemoFunctions() {
  if (typeof window !== 'undefined') {
    (window as any).runFidelityDemo = runFidelityDemo;
    (window as any).validateRealWorldData = validateRealWorldData;
    console.log('🧪 [FidelityDemo] Demo functions injected: window.runFidelityDemo(), window.validateRealWorldData()');
  }
}

// Auto-inject if in browser environment
if (typeof window !== 'undefined') {
  injectDemoFunctions();
}