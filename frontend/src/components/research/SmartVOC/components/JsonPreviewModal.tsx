import React, { useState } from 'react';

interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  jsonData: string;
  pendingAction: 'save' | 'preview' | null;
}

/**
 * Componente para mostrar una vista previa visual del formulario SmartVOC
 */
export const JsonPreviewModal: React.FC<JsonPreviewModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  jsonData,
  pendingAction
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  
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
    randomizeQuestions = false, 
    smartVocRequired = false, 
    questions = [],
    researchId = '',
    metadata = {}
  } = parsedData;

  const handleContinue = () => {
    if (pendingAction === 'preview') {
      // Abre una nueva ventana con la vista previa real
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Vista previa de SmartVOC</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 0;
                padding: 0;
                min-height: 100vh;
                background-color: #f5f5f5;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              .container {
                max-width: 800px;
                width: 90%;
                margin: 40px auto;
                padding: 40px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              h1 {
                font-size: 28px;
                color: #333;
                margin-bottom: 20px;
                text-align: center;
              }
              .question {
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid #eaeaea;
                border-radius: 8px;
              }
              .question-title {
                font-size: 18px;
                color: #333;
                margin-bottom: 12px;
                font-weight: 600;
              }
              .question-description {
                font-size: 14px;
                color: #555;
                margin-bottom: 20px;
              }
              .stars-container {
                display: flex;
                gap: 8px;
                margin: 10px 0;
              }
              .star {
                font-size: 24px;
                color: #ddd;
                cursor: pointer;
              }
              .textarea {
                width: 100%;
                min-height: 100px;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
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
              .note {
                font-size: 12px;
                color: #777;
                font-style: italic;
              }
              .required {
                color: red;
                margin-left: 5px;
              }
              .submit-button {
                background: #3f51b5;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 4px;
                cursor: pointer;
                display: block;
                margin: 20px auto 0;
              }
            </style>
          </head>
          <body>
            <div class="preview-badge">Vista previa</div>
            <div class="container">
              <h1>Encuesta de satisfacción</h1>
              <p class="note">Las preguntas ${randomizeQuestions ? 'se presentarán en orden aleatorio' : 'se presentarán en el orden mostrado'}</p>
              
              <form>
                ${questions.map((q: any, index: number) => `
                  <div class="question">
                    <div class="question-title">
                      ${q.title || `Pregunta ${index+1}`}
                      ${q.required ? '<span class="required">*</span>' : ''}
                    </div>
                    ${q.description ? `<div class="question-description">${q.description}</div>` : ''}
                    
                    ${q.type === 'CSAT' || q.type === 'stars' ? `
                      <div class="stars-container">
                        <span class="star">★</span>
                        <span class="star">★</span>
                        <span class="star">★</span>
                        <span class="star">★</span>
                        <span class="star">★</span>
                      </div>
                    ` : ''}
                    
                    ${q.type === 'VOC' ? `
                      <textarea class="textarea" placeholder="Escriba su respuesta aquí..."></textarea>
                    ` : ''}
                    
                    ${q.type === 'NPS' ? `
                      <div style="display: flex; justify-content: space-between; margin: 20px 0;">
                        <span>0</span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                        <span>10</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <div>Poco probable</div>
                        <div>Muy probable</div>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
                
                <button type="button" class="submit-button">Enviar respuestas</button>
              </form>
            </div>
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
    }
    
    // Continuar con la acción (guardar o cerrar después de la vista previa)
    onContinue();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {showRawJson ? 'Datos JSON del formulario' : 'Vista previa del formulario'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <div className="p-6 overflow-auto flex-grow">
          {!showRawJson ? (
            // Vista previa visual
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h3 className="text-base font-medium text-blue-800 mb-2">📋 Configuración general</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Aleatorizar preguntas:</div>
                  <div className="font-medium">{randomizeQuestions ? '✅ Sí' : '❌ No'}</div>
                  <div className="text-gray-600">Respuestas requeridas:</div>
                  <div className="font-medium">{smartVocRequired ? '✅ Sí' : '❌ No'}</div>
                  <div className="text-gray-600">Preguntas configuradas:</div>
                  <div className="font-medium">{questions.length}</div>
                </div>
              </div>
              
              {/* Resumen de preguntas */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-800 p-2 text-xs text-gray-400">
                  Preguntas configuradas
                </div>
                <div className="divide-y">
                  {questions.map((question: any, index: number) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-gray-800">
                          {question.title || `Pregunta ${index+1}`}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {question.type}
                        </span>
                      </div>
                      {question.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {question.description}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        {question.instructions || '(Sin instrucciones adicionales)'}
                      </div>
                    </div>
                  ))}
                  
                  {questions.length === 0 && (
                    <div className="p-4 text-center text-gray-500 italic">
                      No se han configurado preguntas
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowRawJson(true)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Ver datos JSON
                </button>
              </div>
            </div>
          ) : (
            // Vista de JSON
            <div>
              <div className="bg-gray-50 p-4 rounded border mb-3">
                <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
                  {jsonData}
                </pre>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowRawJson(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver vista previa
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleContinue}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            {pendingAction === 'save' ? 'Guardar' : 'Previsualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}; 