/**
 * NavigationFlow component - High-fidelity implementation matching public-tests
 */

import React, { useState, useRef, useEffect } from 'react';
import type { NavigationFlowResultsProps, NavigationMetrics, VisualClickPoint, ClickTrackingData } from './types';
import { frontendCoordinateFidelityTester, injectFrontendFidelityTest } from '@/utils/coordinate-fidelity-test';
import { runFidelityDemo, validateRealWorldData } from '@/utils/fidelity-validation-demo';

const NavigationFlowResults: React.FC<NavigationFlowResultsProps> = ({ 
  researchId, 
  data 
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showParticipantFilter, setShowParticipantFilter] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('all');
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [imgRenderSize, setImgRenderSize] = useState<{ width: number; height: number } | null>(null);

  // 🧪 INYECTAR UTILIDADES DE TEST DE FIDELIDAD FRONTEND
  useEffect(() => {
    injectFrontendFidelityTest();
    console.log('🧪 [NavigationFlowResults] Frontend fidelity test utilities injected for testing');
  }, []);

  // 🧪 EJECUTAR TESTS DE FIDELIDAD CUANDO CAMBIE LA IMAGEN O DATOS
  useEffect(() => {
    if (imageRef.current && imageNaturalSize && imgRenderSize && (data?.visualClickPoints?.length ?? 0) > 0) {
      const currentImageClicks = data!.visualClickPoints.filter(
        point => point.imageIndex === selectedImageIndex &&
        (selectedParticipant === 'all' || point.participantId === selectedParticipant)
      );

      if (currentImageClicks.length > 0) {
        // Encontrar elementos de clicks renderizados
        const clickElements = document.querySelectorAll(
          '[data-testid^="navigation-click-point"]'
        );

        if (clickElements.length > 0) {
          const testId = `frontend-validation-${researchId}-img-${selectedImageIndex}-${Date.now()}`;
          frontendCoordinateFidelityTester.startTest(testId);

          // Validar cada click
          currentImageClicks.forEach((clickData, index) => {
            if (index < clickElements.length) {
              frontendCoordinateFidelityTester.recordOriginalClickData(testId, {
                x: clickData.x,
                y: clickData.y,
                imageIndex: clickData.imageIndex,
                isCorrect: clickData.isCorrect,
                participantId: clickData.participantId
              });

              frontendCoordinateFidelityTester.recordRenderedClick(
                testId,
                clickElements[index] as HTMLElement,
                imageRef.current!,
                imageNaturalSize
              );
            }
          });

          console.log('🧪 [NavigationFlowResults] Fidelity test completed for current view');
        }
      }
    }
  }, [selectedImageIndex, selectedParticipant, data, imageNaturalSize, imgRenderSize, researchId]);

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        No hay datos de flujo de navegación disponibles
      </div>
    );
  }

  // Calculate metrics from real data
  const calculateMetrics = (): NavigationMetrics => {
    const totalClicks = data.allClicksTracking.length;
    const correctClicks = data.allClicksTracking.filter(click => click.isCorrectHitzone).length;
    const incorrectClicks = totalClicks - correctClicks;
    
    // Calculate average time per image (rough estimation from timestamps)
    const timestamps = data.allClicksTracking.map(click => click.timestamp).sort((a, b) => a - b);
    const totalTime = timestamps.length > 1 ? (timestamps[timestamps.length - 1] - timestamps[0]) / 1000 : 0;
    const averageTimePerImage = data.files.length > 0 ? totalTime / data.files.length : 0;
    
    const completionRate = data.totalParticipants > 0 ? Math.round((correctClicks / data.totalParticipants) * 100) : 0;

    return {
      totalClicks,
      totalParticipants: data.totalParticipants,
      correctClicks,
      incorrectClicks,
      averageTimePerImage: Math.round(averageTimePerImage * 10) / 10,
      completionRate
    };
  };

  const metrics = calculateMetrics();
  
  // Get unique participant IDs
  const participantIds = Array.from(
    new Set(data.visualClickPoints.map(point => point.participantId).filter(Boolean))
  ) as string[];

  // Filter clicks for current image and selected participant
  const getFilteredClicksForCurrentImage = (): VisualClickPoint[] => {
    let clicks = data.visualClickPoints.filter(point => point.imageIndex === selectedImageIndex);
    
    if (selectedParticipant !== 'all') {
      clicks = clicks.filter(point => point.participantId === selectedParticipant);
    }
    
    return clicks;
  };

  const currentImageClicks = getFilteredClicksForCurrentImage();

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImgRenderSize({ width, height });
  };

  const currentImage = data.files[selectedImageIndex];

  // Helper function to get image draw rect (same logic as public-tests)
  function getImageDrawRect(
    imgNatural: { width: number; height: number },
    imgRender: { width: number; height: number }
  ): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
    const imgRatio = imgNatural.width / imgNatural.height;
    const renderRatio = imgRender.width / imgRender.height;
    let drawWidth = imgRender.width;
    let drawHeight = imgRender.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (imgRatio > renderRatio) {
      drawWidth = imgRender.width;
      drawHeight = imgRender.width / imgRatio;
      offsetY = (imgRender.height - drawHeight) / 2;
    } else {
      drawHeight = imgRender.height;
      drawWidth = imgRender.height * imgRatio;
      offsetX = (imgRender.width - drawWidth) / 2;
    }
    
    return { drawWidth, drawHeight, offsetX, offsetY };
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-neutral-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Resultados de Flujo de Navegación</h3>
          <p className="text-sm text-gray-600 mt-1">{data.question}</p>
        </div>
        
        {/* Participant Filter */}
        {participantIds.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Participante:</label>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos ({participantIds.length})</option>
              {participantIds.map(id => (
                <option key={id} value={id}>
                  {id.slice(-8).toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{metrics.totalClicks}</div>
          <div className="text-sm text-blue-600">Total Clicks</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{metrics.correctClicks}</div>
          <div className="text-sm text-green-600">Clicks Correctos</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{metrics.incorrectClicks}</div>
          <div className="text-sm text-red-600">Clicks Incorrectos</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{metrics.totalParticipants}</div>
          <div className="text-sm text-purple-600">Participantes</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{metrics.averageTimePerImage}s</div>
          <div className="text-sm text-orange-600">Tiempo/Imagen</div>
        </div>
        <div className="bg-teal-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-teal-600">{metrics.completionRate}%</div>
          <div className="text-sm text-teal-600">Tasa Éxito</div>
        </div>
      </div>

      {/* Image Navigation */}
      {data.files.length > 1 && (
        <div className="flex justify-center items-center gap-4 mb-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
            disabled={selectedImageIndex === 0}
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Imagen {selectedImageIndex + 1} de {data.files.length}
          </span>
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            onClick={() => setSelectedImageIndex(Math.min(data.files.length - 1, selectedImageIndex + 1))}
            disabled={selectedImageIndex === data.files.length - 1}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Image with Click Visualization */}
      {currentImage && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-medium text-gray-900">
              {currentImage.name || `Imagen ${selectedImageIndex + 1}`}
            </h4>
            <div className="text-sm text-gray-600">
              {currentImageClicks.length} clicks en esta imagen
              {selectedParticipant !== 'all' && ` (${selectedParticipant.slice(-8).toUpperCase()})`}
            </div>
          </div>
          
          <div 
            className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
            style={{ aspectRatio: imageNaturalSize ? `${imageNaturalSize.width} / ${imageNaturalSize.height}` : undefined }}
          >
            <img
              ref={imageRef}
              src={currentImage.url}
              alt={currentImage.name || `Imagen ${selectedImageIndex + 1}`}
              className="w-full h-auto object-contain"
              onLoad={handleImageLoad}
              style={{ display: 'block', maxHeight: '600px' }}
            />
            
            {/* Click Points Overlay - Same as public-tests */}
            {imageNaturalSize && imgRenderSize && (
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{ width: imgRenderSize.width, height: imgRenderSize.height }}
              >
                {currentImageClicks.map((point, index) => (
                  <div
                    key={`${point.timestamp}-${index}`}
                    data-testid={`navigation-click-point-${index}`}
                    data-original-x={point.x}
                    data-original-y={point.y}
                    data-is-correct={point.isCorrect}
                    data-image-index={point.imageIndex}
                    data-participant-id={point.participantId || ''}
                    className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-lg ${
                      point.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      left: point.x - 6,
                      top: point.y - 6,
                      zIndex: 10
                    }}
                    title={`${point.isCorrect ? 'Correcto' : 'Incorrecto'} - ${new Date(point.timestamp).toLocaleTimeString()}${
                      point.participantId ? ` - ${point.participantId.slice(-8).toUpperCase()}` : ''
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🧪 FIDELITY TEST CONTROL PANEL */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
          🧪 Controles de Test de Fidelidad
          <span className="ml-2 text-sm text-gray-600">(Solo para testing)</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const report = frontendCoordinateFidelityTester.generateFrontendFidelityReport();
              console.log('📊 Frontend Fidelity Report:', report);
              alert(`Fidelity Test Results:\n- Total Tests: ${report.totalTests}\n- Accurate: ${report.accurateTests}\n- Accuracy: ${report.accuracyPercentage.toFixed(1)}%\n- Avg Pixel Diff: ${report.averagePixelDifference.toFixed(2)}px\n\nCheck console for details`);
            }}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Generate Report
          </button>
          <button
            onClick={() => {
              frontendCoordinateFidelityTester.exportResults();
            }}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            Export Results
          </button>
          <button
            onClick={() => {
              frontendCoordinateFidelityTester.clearResults();
              console.log('🗑️ All fidelity test results cleared');
            }}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear Tests
          </button>
          <button
            onClick={() => {
              // Trigger manual validation for current view
              const clickElements = document.querySelectorAll('[data-testid^="navigation-click-point"]');
              const currentImageClicks = data.visualClickPoints.filter(
                point => point.imageIndex === selectedImageIndex &&
                (selectedParticipant === 'all' || point.participantId === selectedParticipant)
              );
              
              if (clickElements.length > 0 && imageRef.current && imageNaturalSize) {
                const testId = `manual-validation-${Date.now()}`;
                frontendCoordinateFidelityTester.startTest(testId);
                
                currentImageClicks.forEach((clickData, index) => {
                  if (index < clickElements.length) {
                    frontendCoordinateFidelityTester.recordOriginalClickData(testId, {
                      x: clickData.x,
                      y: clickData.y,
                      imageIndex: clickData.imageIndex,
                      isCorrect: clickData.isCorrect,
                      participantId: clickData.participantId
                    });
                    
                    frontendCoordinateFidelityTester.recordRenderedClick(
                      testId,
                      clickElements[index] as HTMLElement,
                      imageRef.current!,
                      imageNaturalSize
                    );
                  }
                });
                
                console.log(`✅ Manual validation completed for ${currentImageClicks.length} clicks`);
                alert(`Manual validation completed for ${currentImageClicks.length} clicks. Check console for results.`);
              } else {
                alert('No clicks or image data available for validation');
              }
            }}
            className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
          >
            Manual Validate
          </button>
          <button
            onClick={() => {
              const result = runFidelityDemo();
              console.log('🧪 Fidelity Demo Result:', result);
              alert(`Demo Test Results:\n- Success: ${result.success ? 'Yes' : 'No'}\n- Total Tests: ${result.summary.totalTests}\n- Accuracy: ${result.summary.accuracyPercentage.toFixed(1)}%\n- Avg Diff: ${result.summary.averagePixelDifference.toFixed(2)}px\n\n${result.issues.length > 0 ? 'Issues: ' + result.issues.join(', ') : 'All tests passed!'}`);
            }}
            className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600"
          >
            Run Demo
          </button>
          <button
            onClick={() => {
              const clickElements = document.querySelectorAll('[data-testid^="navigation-click-point"]');
              const currentImageClicks = data.visualClickPoints.filter(
                point => point.imageIndex === selectedImageIndex &&
                (selectedParticipant === 'all' || point.participantId === selectedParticipant)
              );
              
              if (imageRef.current && currentImageClicks.length > 0) {
                const result = validateRealWorldData(
                  imageRef.current,
                  currentImageClicks,
                  Array.from(clickElements) as HTMLElement[]
                );
                console.log('🧪 Real-World Validation Result:', result);
                alert(`Real-World Validation:\n- Success: ${result.success ? 'Yes' : 'No'}\n- Tests: ${result.summary.totalTests}\n- Accuracy: ${result.summary.accuracyPercentage.toFixed(1)}%\n- Avg Diff: ${result.summary.averagePixelDifference.toFixed(2)}px\n\n${result.issues.length > 0 ? 'Issues:\n' + result.issues.join('\n') : 'All validations passed!'}`);
              } else {
                alert('No image or click data available for real-world validation');
              }
            }}
            className="px-3 py-1 bg-teal-500 text-white text-sm rounded hover:bg-teal-600"
          >
            Validate Real Data
          </button>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          Use these controls to test coordinate fidelity between original clicks and rendered visualization.
          Open browser console to see detailed test results and comparisons.
        </div>
      </div>

      {/* Click Details Table */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Detalle de Clicks</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Participante</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Coordenadas</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Resultado</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Timestamp</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hitzone</th>
              </tr>
            </thead>
            <tbody>
              {currentImageClicks
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((point, index) => (
                  <tr key={`${point.timestamp}-${index}`} className="border-t border-gray-200">
                    <td className="px-4 py-2 text-sm">
                      {point.participantId ? point.participantId.slice(-8).toUpperCase() : 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm font-mono">
                      ({Math.round(point.x)}, {Math.round(point.y)})
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        point.isCorrect 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {point.isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(point.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {data.allClicksTracking
                        .find(click => 
                          click.x === point.x && 
                          click.y === point.y && 
                          click.timestamp === point.timestamp
                        )?.hitzoneId || 'N/A'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          
          {currentImageClicks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay clicks registrados para esta imagen
              {selectedParticipant !== 'all' && ` del participante ${selectedParticipant.slice(-8).toUpperCase()}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationFlowResults;