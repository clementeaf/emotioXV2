import React, { useState, useEffect, useRef } from 'react';

interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  jsonData: string;
  pendingAction: 'save' | 'preview' | null;
  hasValidationErrors?: boolean;
}

/**
 * Componente para mostrar una vista previa visual del formulario de tareas cognitivas
 */
export const JsonPreviewModal: React.FC<JsonPreviewModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  jsonData,
  pendingAction,
  hasValidationErrors = false
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  // Referencia a los botones de navegación
  const navButtonsRef = useRef<HTMLDivElement>(null);
  
  // Parseamos el JSON para extraer los datos
  let parsedData: any = {};
  let questionsHtml = '';
  
  try {
    parsedData = JSON.parse(jsonData);
    
    // Función para determinar si una pregunta ha sido modificada
    const isQuestionModified = (question: any) => {
      // Considera una pregunta como modificada si tiene alguna propiedad
      // distinta a los valores predeterminados o si tiene archivos o elecciones
      return (
        question.title !== `Pregunta ${question.id}` ||
        question.description !== '' ||
        (question.choices && question.choices.length > 0) ||
        (question.files && question.files.length > 0)
      );
    };
    
    // Función para determinar si una pregunta se enviará
    // (requiere archivos para ciertos tipos de preguntas)
    const willQuestionBeSent = (question: any) => {
      const requiresFiles = ['navigation_flow', 'preference_test'].includes(question.type);
      
      if (requiresFiles) {
        return question.files && question.files.length > 0;
      }
      
      return true;
    };
    
    // Genera el HTML para cada pregunta
    if (parsedData.questions) {
      questionsHtml = parsedData.questions
        .map((question: any, index: number) => {
          const isModified = isQuestionModified(question);
          const willSend = willQuestionBeSent(question);
          
          // Determina el estilo de la tarjeta
          let cardClass = 'question-card';
          if (!isModified) cardClass += ' red-card';
          else if (!willSend) cardClass += ' yellow-card';
          else cardClass += ' blue-card';
          
          // Función para renderizar las opciones en preguntas de selección
          const renderChoices = (choices: any[]) => {
            if (!choices || choices.length === 0) return '<p class="empty-notice">Sin opciones</p>';
            
            return `
              <div class="choices-list">
                ${choices.map((choice, i) => `
                  <div class="choice-item">
                    <span class="choice-number">${i + 1}.</span>
                    <span class="choice-text">${choice.text || 'Sin texto'}</span>
                  </div>
                `).join('')}
              </div>
            `;
          };
          
          // Función para mostrar archivos
          const renderFiles = (files: any[]) => {
            if (!files || files.length === 0) return '<p class="empty-notice">Sin archivos</p>';
            
            return `
              <div class="files-list">
                ${files.map(file => `
                  <div class="file-item">
                    <div class="file-icon">📎</div>
                    <div class="file-info">
                      <div class="file-name">${file.name || 'Archivo sin nombre'}</div>
                      <div class="file-url">${file.url || 'Sin URL'}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          };
          
          // Función para obtener la etiqueta del tipo de pregunta
          const getQuestionTypeLabel = (type: string) => {
            const typeMap: Record<string, string> = {
              'short_text': 'Texto corto',
              'long_text': 'Texto largo',
              'single_choice': 'Opción única',
              'multiple_choice': 'Opción múltiple',
              'linear_scale': 'Escala lineal',
              'ranking': 'Clasificación',
              'navigation_flow': 'Flujo de navegación',
              'preference_test': 'Prueba de preferencia'
            };
            
            return typeMap[type] || type;
          };
          
          return `
            <div class="${cardClass}" id="question-${question.id}">
              <div class="question-header" data-id="${question.id}">
                <h3>Pregunta ${index + 1}: ${question.title}</h3>
                <span class="question-type">${getQuestionTypeLabel(question.type)}</span>
              </div>
              
              <div class="question-body">
                <div class="detail-row">
                  <strong>Descripción:</strong> 
                  <span>${question.description || '<span class="empty-value">Sin descripción</span>'}</span>
                </div>
                
                <div class="detail-row">
                  <strong>Obligatoria:</strong> 
                  <span>${question.required ? 'Sí' : 'No'}</span>
                </div>
                
                ${['single_choice', 'multiple_choice'].includes(question.type) ? `
                  <div class="detail-section">
                    <strong>Opciones:</strong>
                    ${renderChoices(question.choices)}
                  </div>
                ` : ''}
                
                ${['navigation_flow', 'preference_test'].includes(question.type) ? `
                  <div class="detail-section">
                    <strong>Archivos:</strong>
                    ${renderFiles(question.files)}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
  
  // Hooks para agregar funcionalidad de scroll a los botones de navegación
  useEffect(() => {
    // La función para gestionar clicks en los botones de navegación
    const handleNavButtonClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const questionId = target.getAttribute('data-question');
      if (questionId) {
        const questionElement = document.getElementById(`question-${questionId}`);
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Actualizar botón activo
          const allButtons = document.querySelectorAll('.nav-button');
          allButtons.forEach(btn => btn.classList.remove('active'));
          target.classList.add('active');
        }
      }
    };

    // Solo configurar el event listener si el modal está abierto
    if (isOpen) {
      // Usar setTimeout para asegurarnos que el DOM ya está renderizado
      const timerId = setTimeout(() => {
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
          button.addEventListener('click', handleNavButtonClick);
        });
      }, 100);
      
      // Cleanup function para eliminar los event listeners
      return () => {
        clearTimeout(timerId);
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
          button.removeEventListener('click', handleNavButtonClick);
        });
      };
    }
    
    // Función de limpieza vacía si el modal no está abierto
    return () => {};
  }, [isOpen]); // Solo re-ejecutar si cambia isOpen
  
  // Retorno temprano
  if (!isOpen) return null;

  // Función para continuar con la acción
  const handleContinue = () => {
    // Si la acción es previsualizar, abrimos una nueva ventana con el HTML
    if (pendingAction === 'preview') {
      const previewWindow = window.open('', '_blank');
      
      if (previewWindow) {
        try {
          // Inicializar la ventana con un mensaje de carga
          previewWindow.document.write('<html><body><h1>Cargando vista previa...</h1></body></html>');
          
          // Contenido HTML para la vista previa
          previewWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Vista previa de tarea cognitiva</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f8f9fa;
                }
                .container {
                  max-width: 800px;
                  margin: 2rem auto;
                  padding: 2rem;
                  background-color: #fff;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                header {
                  margin-bottom: 2rem;
                  text-align: center;
                }
                h1 {
                  color: #2563eb;
                  margin-bottom: 0.5rem;
                }
                .description {
                  color: #64748b;
                  margin-bottom: 2rem;
                }
                form {
                  display: flex;
                  flex-direction: column;
                  gap: 2rem;
                }
                .question {
                  padding: 1.5rem;
                  background-color: #f8fafc;
                  border-radius: 8px;
                  border: 1px solid #e2e8f0;
                }
                .question-number {
                  font-size: 0.875rem;
                  color: #64748b;
                  margin-bottom: 0.5rem;
                }
                .question-title {
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
                  color: #0f172a;
                }
                .question-description {
                  margin-bottom: 1rem;
                  color: #475569;
                }
                .required {
                  color: #ef4444;
                  margin-left: 0.25rem;
                }
                .choices {
                  display: flex;
                  flex-direction: column;
                  gap: 0.75rem;
                  margin-top: 1rem;
                }
                .choice {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                }
                .choice input {
                  margin: 0;
                }
                .choice label {
                  font-size: 1rem;
                  color: #334155;
                }
                .submit-btn {
                  margin-top: 2rem;
                  padding: 0.75rem 1.5rem;
                  background-color: #2563eb;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  font-size: 1rem;
                  font-weight: 500;
                  cursor: pointer;
                  align-self: center;
                }
                .submit-btn:hover {
                  background-color: #1d4ed8;
                }
                textarea, input[type="text"] {
                  width: 100%;
                  padding: 0.75rem;
                  border: 1px solid #cbd5e1;
                  border-radius: 4px;
                  font-size: 1rem;
                  margin-top: 0.5rem;
                }
                .linear-scale {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
                  gap: 0.5rem;
                  margin-top: 1rem;
                }
                .scale-label {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  text-align: center;
                }
                .scale-label input {
                  margin-bottom: 0.25rem;
                }
                .scale-label span {
                  font-size: 0.875rem;
                  color: #64748b;
                }
                .ranking-item {
                  display: flex;
                  align-items: center;
                  gap: 0.75rem;
                  padding: 0.75rem;
                  background-color: #fff;
                  border: 1px solid #e2e8f0;
                  border-radius: 4px;
                  margin-bottom: 0.5rem;
                }
                .ranking-number {
                  font-weight: 600;
                  color: #64748b;
                }
                .file-preview {
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                  margin-top: 1rem;
                }
                .file-item {
                  text-align: center;
                }
                .file-item img {
                  max-width: 100%;
                  border-radius: 4px;
                  border: 1px solid #e2e8f0;
                }
                .file-name {
                  font-size: 0.875rem;
                  color: #64748b;
                  margin-top: 0.5rem;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <header>
                  <h1>${parsedData.title || 'Tarea cognitiva'}</h1>
                  <div class="description">${parsedData.description || 'Complete las siguientes preguntas.'}</div>
                </header>
                
                <form>
                  ${parsedData.questions?.map((q: any, index: number) => {
                    let questionContent = '';
                    
                    switch(q.type) {
                      case 'short_text':
                        questionContent = `<input type="text" placeholder="Tu respuesta">`;
                        break;
                      case 'long_text':
                        questionContent = `<textarea rows="4" placeholder="Tu respuesta"></textarea>`;
                        break;
                      case 'single_choice':
                        questionContent = `
                          <div class="choices">
                            ${q.choices?.map((choice: any, choiceIndex: number) => `
                              <div class="choice">
                                <input type="radio" id="choice-${q.id}-${choiceIndex}" name="question-${q.id}">
                                <label for="choice-${q.id}-${choiceIndex}">${choice.text || `Opción ${choiceIndex + 1}`}</label>
                              </div>
                            `).join('') || '<p>No hay opciones disponibles</p>'}
                          </div>
                        `;
                        break;
                      case 'multiple_choice':
                        questionContent = `
                          <div class="choices">
                            ${q.choices?.map((choice: any, choiceIndex: number) => `
                              <div class="choice">
                                <input type="checkbox" id="choice-${q.id}-${choiceIndex}" name="question-${q.id}">
                                <label for="choice-${q.id}-${choiceIndex}">${choice.text || `Opción ${choiceIndex + 1}`}</label>
                              </div>
                            `).join('') || '<p>No hay opciones disponibles</p>'}
                          </div>
                        `;
                        break;
                      case 'linear_scale':
                        questionContent = `
                          <div class="linear-scale">
                            ${Array.from({ length: 5 }, (_, i) => `
                              <div class="scale-label">
                                <input type="radio" id="scale-${q.id}-${i+1}" name="question-${q.id}">
                                <label for="scale-${q.id}-${i+1}">${i+1}</label>
                              </div>
                            `).join('')}
                          </div>
                        `;
                        break;
                      case 'ranking':
                        questionContent = `
                          <div class="ranking">
                            ${q.choices?.map((choice: any, choiceIndex: number) => `
                              <div class="ranking-item">
                                <span class="ranking-number">${choiceIndex + 1}</span>
                                <span>${choice.text || `Opción ${choiceIndex + 1}`}</span>
                              </div>
                            `).join('')}
                          </div>
                          <div style="margin-top: 20px;">
                            <input type="text" placeholder="Tu respuesta">
                          </div>
                        `;
                        break;
                      default:
                        questionContent = `<p style="color: #666;">Tipo de pregunta no compatible con la vista previa.</p>`;
                    }
                    
                    return `
                      <div class="question">
                        <div class="question-number">Pregunta ${index + 1}</div>
                        <div class="question-title">
                          ${q.title || `Pregunta sin título`}
                          ${q.required ? '<span class="required">*</span>' : ''}
                        </div>
                        ${q.description ? `<div class="question-description">${q.description}</div>` : ''}
                        ${questionContent}
                      </div>
                    `;
                  }).join('')}
                  
                  <button type="button" class="submit-btn">Enviar respuestas</button>
                </form>
              </div>
            </body>
            </html>
          `);
          previewWindow.document.close();
        } catch (error) {
          console.error('Error al generar la vista previa:', error);
          previewWindow.document.write(`
            <html><body>
              <h1>Error al generar la vista previa</h1>
              <p>Ocurrió un error al procesar los datos del formulario.</p>
            </body></html>
          `);
          previewWindow.document.close();
        }
      }
    }
    
    // Continuar con la acción
    onContinue();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
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
          {hasValidationErrors && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <div className="font-semibold">⚠️ Advertencia: El formulario tiene errores de validación</div>
              <p className="text-sm mt-1">Este formulario contiene errores que deben corregirse antes de continuar.</p>
            </div>
          )}
          
          {!showRawJson ? (
            // Vista previa visual
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Pregunta modificada</span>
                </div>
                <div className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Pregunta sin modificar</span>
                </div>
                <div className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Pregunta que no se enviará (sin archivos)</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h3 className="text-base font-medium text-blue-800 mb-2">📋 Configuración general</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Aleatorizar preguntas:</div>
                  <div className="font-medium">{parsedData.randomizeQuestions ? '✅ Sí' : '❌ No'}</div>
                  <div className="text-gray-600">Total de preguntas:</div>
                  <div className="font-medium">{parsedData.questions?.length || 0}</div>
                </div>
              </div>
              
              {/* Navegación de preguntas */}
              <div className="bg-gray-50 p-3 rounded border mb-4">
                <div className="font-medium mb-2">Ir a pregunta:</div>
                <div className="flex flex-wrap gap-2" ref={navButtonsRef}>
                  {parsedData.questions?.map((q: any, index: number) => (
                    <button 
                      key={q.id}
                      className="nav-button py-1 px-2 text-sm border rounded hover:bg-gray-100"
                      data-question={q.id}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Lista de preguntas */}
              <div className="space-y-4" dangerouslySetInnerHTML={{ __html: questionsHtml }} />
            </div>
          ) : (
            // Vista JSON
            <div>
              <pre className="bg-gray-50 p-4 rounded border overflow-auto text-sm whitespace-pre-wrap">
                {jsonData}
              </pre>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <span>{showRawJson ? '👁️ Ver vista previa visual' : '{ } Ver JSON'}</span>
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 bg-white rounded text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleContinue}
              className={`px-4 py-2 rounded text-white ${
                hasValidationErrors 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : pendingAction === 'preview'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={hasValidationErrors}
            >
              {pendingAction === 'preview' 
                ? 'Continuar con la previsualización' 
                : 'Guardar formulario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 