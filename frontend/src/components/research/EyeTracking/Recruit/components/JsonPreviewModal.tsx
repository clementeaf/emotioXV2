import React, { useState } from 'react';

interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  jsonData: string;
  pendingAction: 'save' | 'preview' | null;
}

export const JsonPreviewModal: React.FC<JsonPreviewModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  jsonData,
  pendingAction
}) => {
  const [currentView, setCurrentView] = useState<'config' | 'json'>('config');
  
  if (!isOpen) return null;
  
  // Parseamos el JSON para extraer los datos
  let parsedData: any = {};
  try {
    parsedData = JSON.parse(jsonData);
  } catch (error) {
    console.error('Error al parsear JSON:', error);
  }
  
  // Extraemos los valores para usar en la vista previa
  const { 
    demographicQuestions = {},
    linkConfig = {},
    participantLimit = {},
    backlinks = {},
    researchUrl = '',
    parameterOptions = {}
  } = parsedData.config || {};

  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {content}
    </div>
  );

  const renderCheckboxList = (items: Record<string, boolean>, title: string) => (
    <div className="bg-white rounded-lg p-4 border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">{title}</h4>
      </div>
      <div className="space-y-2">
        {Object.entries(items).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded flex items-center justify-center ${value ? 'bg-blue-500' : 'bg-neutral-200'}`}>
              {value && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const openParticipantView = () => {
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vista previa - Eye Tracking</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 0;
              min-height: 100vh;
              background-color: #f5f5f5;
            }
            .preview-badge {
              position: fixed;
              top: 10px;
              right: 10px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 5px 10px;
              font-size: 12px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="preview-badge">Vista previa</div>
          
          <div class="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <!-- Pantalla de bienvenida -->
            <div class="bg-white rounded-lg p-6 border border-neutral-200">
              <h2 class="text-2xl font-bold mb-4">Bienvenido/a al estudio</h2>
              <p class="text-neutral-600 mb-6">
                Gracias por participar en nuestro estudio de seguimiento ocular. A continuación, le pediremos algunos datos y realizaremos una breve calibración.
              </p>
              
              <!-- Requisitos técnicos -->
              <div class="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 class="font-medium text-blue-800 mb-2">Requisitos técnicos:</h3>
                <ul class="list-disc list-inside text-sm text-blue-700 space-y-1">
                  <li>Navegador web actualizado (Chrome recomendado)</li>
                  <li>Cámara web funcionando correctamente</li>
                  <li>Buena iluminación en la habitación</li>
                  <li>Posición estable frente a la pantalla</li>
                </ul>
              </div>

              <!-- Información de privacidad -->
              <div class="text-sm text-neutral-500">
                <h4 class="font-medium text-neutral-700 mb-2">Información que recopilaremos:</h4>
                <ul class="list-inside space-y-1">
                  ${parameterOptions.saveDeviceInfo ? '<li>✓ Información de su dispositivo</li>' : ''}
                  ${parameterOptions.saveLocationInfo ? '<li>✓ Ubicación aproximada</li>' : ''}
                  ${parameterOptions.saveResponseTimes ? '<li>✓ Tiempos de respuesta</li>' : ''}
                  ${parameterOptions.saveUserJourney ? '<li>✓ Interacciones durante el estudio</li>' : ''}
                </ul>
              </div>
            </div>

            <!-- Sección demográfica -->
            ${Object.values(demographicQuestions).some(v => v) ? `
              <div class="bg-white rounded-lg p-6 border border-neutral-200">
                <h2 class="text-xl font-semibold mb-4">Información demográfica</h2>
                <div class="space-y-6">
                  ${demographicQuestions.age ? `
                    <div>
                      <label class="block text-sm font-medium mb-2">Edad</label>
                      <select class="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white">
                        <option value="">Seleccione su rango de edad</option>
                        <option value="18-24">18-24 años</option>
                        <option value="25-34">25-34 años</option>
                        <option value="35-44">35-44 años</option>
                        <option value="45-54">45-54 años</option>
                        <option value="55+">55 años o más</option>
                      </select>
                    </div>
                  ` : ''}

                  ${demographicQuestions.gender ? `
                    <div>
                      <label class="block text-sm font-medium mb-2">Género</label>
                      <div class="space-y-2">
                        <label class="flex items-center gap-2">
                          <input type="radio" name="gender" class="w-4 h-4">
                          <span>Masculino</span>
                        </label>
                        <label class="flex items-center gap-2">
                          <input type="radio" name="gender" class="w-4 h-4">
                          <span>Femenino</span>
                        </label>
                        <label class="flex items-center gap-2">
                          <input type="radio" name="gender" class="w-4 h-4">
                          <span>Prefiero no decirlo</span>
                        </label>
                      </div>
                    </div>
                  ` : ''}

                  ${demographicQuestions.country ? `
                    <div>
                      <label class="block text-sm font-medium mb-2">País</label>
                      <select class="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white">
                        <option value="">Seleccione su país</option>
                        <option value="ES">España</option>
                        <option value="MX">México</option>
                        <option value="AR">Argentina</option>
                        <option value="CO">Colombia</option>
                        <option value="PE">Perú</option>
                      </select>
                    </div>
                  ` : ''}

                  ${demographicQuestions.educationLevel ? `
                    <div>
                      <label class="block text-sm font-medium mb-2">Nivel educativo</label>
                      <select class="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white">
                        <option value="">Seleccione su nivel educativo</option>
                        <option value="primary">Educación primaria</option>
                        <option value="secondary">Educación secundaria</option>
                        <option value="bachelor">Grado universitario</option>
                        <option value="master">Máster</option>
                        <option value="phd">Doctorado</option>
                      </select>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Calibración -->
            <div class="bg-white rounded-lg p-6 border border-neutral-200">
              <h2 class="text-xl font-semibold mb-4">Calibración del seguimiento ocular</h2>
              <div class="aspect-video bg-neutral-900 rounded-lg flex items-center justify-center">
                <div class="text-center text-white">
                  <div class="mb-4">
                    <svg class="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p class="text-lg">Por favor, mire fijamente al punto central</p>
                  <p class="text-sm text-neutral-400 mt-2">Calibrando el seguimiento ocular...</p>
                </div>
              </div>
            </div>

            <!-- Botón de continuar -->
            <div class="flex justify-end">
              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Continuar
              </button>
            </div>
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Vista previa del formulario
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('config')}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentView === 'config' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Configuración
              </button>
              <button
                onClick={openParticipantView}
                className="px-3 py-1 rounded-md text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Vista participante
              </button>
              <button
                onClick={() => setCurrentView('json')}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentView === 'json' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                JSON
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentView === 'json' ? (
            <pre className="bg-neutral-50 p-4 rounded-lg overflow-auto">
              <code className="text-sm">{jsonData}</code>
            </pre>
          ) : (
            <div className="space-y-6">
              {renderSection('Configuración general', (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderCheckboxList(demographicQuestions, 'Preguntas demográficas')}
                  {renderCheckboxList(linkConfig, 'Configuración del enlace')}
                </div>
              ))}

              {renderSection('Límite de participantes', (
                <div className="bg-white rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-sm ${participantLimit.enabled ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      {participantLimit.enabled ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                  {participantLimit.enabled && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-medium">Límite:</span>
                      <span className="text-lg">{participantLimit.value}</span>
                      <span className="text-sm text-neutral-500">participantes</span>
                    </div>
                  )}
                </div>
              ))}

              {renderSection('Enlaces de retorno', (
                <div className="bg-white rounded-lg p-4 border border-neutral-200 space-y-4">
                  {Object.entries(backlinks).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-sm font-medium block mb-1">{key}:</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-neutral-100 rounded text-sm">https://</span>
                        <span className="text-sm">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {renderSection('URL de investigación', (
                <div className="bg-white rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-neutral-100 rounded text-sm">https://</span>
                    <span className="text-sm break-all">{researchUrl}</span>
                  </div>
                </div>
              ))}

              {renderSection('Parámetros a guardar', (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parameterOptions).map(([key, value]) => (
                    <div
                      key={key}
                      className={`px-3 py-1 rounded-full text-sm ${
                        value 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-200 bg-white shadow-sm hover:bg-neutral-100 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 text-sm font-medium"
          >
            {pendingAction === 'save' ? 'Guardar' : 'Previsualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}; 