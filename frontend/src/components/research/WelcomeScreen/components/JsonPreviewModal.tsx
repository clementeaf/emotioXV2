import React, { useState } from 'react';

interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  jsonData: string;
  pendingAction: 'save' | 'preview' | null;
}

/**
 * Componente para mostrar una vista previa visual de la pantalla de bienvenida
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
    title = '', 
    message = '', 
    startButtonText = '', 
    isEnabled = true, 
    theme = 'default',
    logoUrl = '',
    backgroundImageUrl = '',
    disclaimer = ''
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
            <title>Vista previa de pantalla de bienvenida</title>
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
              .welcome-container {
                max-width: 800px;
                width: 90%;
                margin: 40px auto;
                padding: 40px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
              }
              h1 {
                font-size: 28px;
                color: #333;
                margin-bottom: 20px;
              }
              .message {
                font-size: 16px;
                line-height: 1.6;
                color: #555;
                margin-bottom: 30px;
              }
              .disclaimer {
                font-size: 12px;
                color: #777;
                margin-top: 20px;
                font-style: italic;
              }
              .start-button {
                background-color: #3f51b5;
                color: white;
                border: none;
                padding: 12px 28px;
                font-size: 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
              }
              .start-button:hover {
                background-color: #303f9f;
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
              img.logo {
                max-height: 80px;
                margin-bottom: 20px;
              }
              .background-image {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: -1;
                opacity: 0.1;
                background-size: cover;
                background-position: center;
              }
            </style>
          </head>
          <body>
            <div class="preview-badge">Vista previa</div>
            ${backgroundImageUrl ? `<div class="background-image" style="background-image: url('${backgroundImageUrl}')"></div>` : ''}
            <div class="welcome-container">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
              <h1>${title || 'Título de la pantalla de bienvenida'}</h1>
              <div class="message">${message || 'Mensaje de bienvenida para los participantes...'}</div>
              <button class="start-button">${startButtonText || 'Comenzar'}</button>
              ${disclaimer ? `<div class="disclaimer">${disclaimer}</div>` : ''}
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
                <h3 className="text-base font-medium text-blue-800 mb-2">📋 Información de la pantalla</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Estado:</div>
                  <div className="font-medium">{isEnabled ? '✅ Habilitada' : '❌ Deshabilitada'}</div>
                  <div className="text-gray-600">Tema:</div>
                  <div className="font-medium">{theme || 'Predeterminado'}</div>
                </div>
              </div>
              
              {/* Simulación de cómo se verá la pantalla */}
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-800 p-2 text-xs text-gray-400">
                  Vista previa de pantalla
                </div>
                <div className="bg-gray-50 p-8 relative min-h-[300px] flex flex-col items-center justify-center text-center">
                  {backgroundImageUrl && (
                    <div 
                      className="absolute inset-0 opacity-10 bg-center bg-cover z-0" 
                      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
                    />
                  )}
                  <div className="relative z-10 max-w-lg mx-auto">
                    {logoUrl && (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="h-16 mb-4 mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <h1 className="text-2xl font-bold mb-4 text-gray-800">{title || '[Sin título]'}</h1>
                    <div className="text-gray-600 mb-6 whitespace-pre-line">
                      {message || '[Sin mensaje]'}
                    </div>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
                      {startButtonText || '[Sin texto del botón]'}
                    </button>
                    {disclaimer && (
                      <div className="mt-6 text-xs text-gray-500 italic">
                        {disclaimer}
                      </div>
                    )}
                  </div>
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
        
        <div className="flex justify-end p-4 border-t space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
          
          <button
            onClick={handleContinue}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {pendingAction === 'save' ? 'Guardar' : 'Abrir vista previa completa'}
          </button>
        </div>
      </div>
    </div>
  );
}; 