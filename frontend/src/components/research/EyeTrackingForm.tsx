'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface EyeTrackingFormProps {
  researchId: string;
  className?: string;
}

interface EyeTrackingConfig {
  calibration: boolean;
  validation: boolean;
  recordAudio: boolean;
  recordVideo: boolean;
  showGaze: boolean;
  showFixations: boolean;
  showSaccades: boolean;
  showHeatmap: boolean;
  samplingRate: number;
  fixationThreshold: number;
  saccadeVelocityThreshold: number;
}

export function EyeTrackingForm({ researchId, className }: EyeTrackingFormProps) {
  const [config, setConfig] = useState<EyeTrackingConfig>({
    calibration: true,
    validation: true,
    recordAudio: false,
    recordVideo: true,
    showGaze: true,
    showFixations: true,
    showSaccades: true,
    showHeatmap: true,
    samplingRate: 60,
    fixationThreshold: 100,
    saccadeVelocityThreshold: 30
  });

  const [activeTab, setActiveTab] = useState('setup');

  const handleConfigChange = (key: keyof EyeTrackingConfig, value: boolean | number) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className={cn("max-w-5xl mx-auto", className)}>
      {/* Tabs Navigation */}
      <div className="flex mb-6 bg-white rounded-lg border border-neutral-200 p-1">
        <button
          className={cn(
            "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
            activeTab === 'setup' 
              ? "bg-blue-50 text-blue-600" 
              : "text-neutral-600 hover:text-neutral-900"
          )}
          onClick={() => setActiveTab('setup')}
        >
          Configuración
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
            activeTab === 'stimuli' 
              ? "bg-blue-50 text-blue-600" 
              : "text-neutral-600 hover:text-neutral-900"
          )}
          onClick={() => setActiveTab('stimuli')}
        >
          Estímulos
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
            activeTab === 'preview' 
              ? "bg-blue-50 text-blue-600" 
              : "text-neutral-600 hover:text-neutral-900"
          )}
          onClick={() => setActiveTab('preview')}
        >
          Vista previa
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
            activeTab === 'advanced' 
              ? "bg-blue-50 text-blue-600" 
              : "text-neutral-600 hover:text-neutral-900"
          )}
          onClick={() => setActiveTab('advanced')}
        >
          Opciones avanzadas
        </button>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          {activeTab === 'setup' && (
            <>
              <header className="mb-6">
                <h1 className="text-lg font-semibold text-neutral-900">
                  Configuración de Seguimiento Ocular
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Configure las opciones de seguimiento ocular para su estudio de investigación.
                </p>
              </header>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-medium text-neutral-900">Activar Seguimiento Ocular</h2>
                    <p className="text-sm text-neutral-500">Incluir la funcionalidad de seguimiento ocular en este estudio.</p>
                  </div>
                  <Switch checked={config.calibration} onCheckedChange={(checked: boolean) => handleConfigChange('calibration', checked)} />
                </div>

                {config.calibration && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-neutral-900">Dispositivo de Seguimiento</h3>
                        <select className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                          <option value="webcam">Webcam estándar</option>
                          <option value="tobii">Tobii Eye Tracker 5</option>
                          <option value="gazepoint">GazePoint GP3 HD</option>
                          <option value="eyetech">EyeTech VT3 Mini</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-neutral-900">Frecuencia de muestreo</h3>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={config.samplingRate}
                            onChange={(e) => handleConfigChange('samplingRate', parseInt(e.target.value))}
                            min={30}
                            max={120}
                            className="w-full"
                          />
                          <span className="text-sm text-neutral-500">Hz</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-900">Opciones de seguimiento</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="text-sm text-neutral-800">Calibración</span>
                          <Switch checked={config.validation} onCheckedChange={(checked: boolean) => handleConfigChange('validation', checked)} />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="text-sm text-neutral-800">Validación</span>
                          <Switch checked={config.validation} onCheckedChange={(checked: boolean) => handleConfigChange('validation', checked)} />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="text-sm text-neutral-800">Grabar audio</span>
                          <Switch checked={config.recordAudio} onCheckedChange={(checked: boolean) => handleConfigChange('recordAudio', checked)} />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="text-sm text-neutral-800">Grabar video</span>
                          <Switch checked={config.recordVideo} onCheckedChange={(checked: boolean) => handleConfigChange('recordVideo', checked)} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-neutral-900">Visualización en tiempo real</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="text-sm text-neutral-800">Mostrar mirada</span>
                          <Switch checked={config.showGaze} onCheckedChange={(checked: boolean) => handleConfigChange('showGaze', checked)} />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="text-sm text-neutral-800">Mostrar fijaciones</span>
                          <Switch checked={config.showFixations} onCheckedChange={(checked: boolean) => handleConfigChange('showFixations', checked)} />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="text-sm text-neutral-800">Mostrar movimientos sacádicos</span>
                          <Switch checked={config.showSaccades} onCheckedChange={(checked: boolean) => handleConfigChange('showSaccades', checked)} />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="text-sm text-neutral-800">Mostrar mapa de calor</span>
                          <Switch checked={config.showHeatmap} onCheckedChange={(checked: boolean) => handleConfigChange('showHeatmap', checked)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'stimuli' && (
            <>
              <header className="mb-6">
                <h1 className="text-lg font-semibold text-neutral-900">
                  Configuración de Estímulos Visuales
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Suba y organice las imágenes estímulo para el experimento de seguimiento ocular.
                </p>
              </header>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-900">Subir imágenes estímulo</h3>
                  <p className="text-sm text-neutral-500">
                    Suba las imágenes que se mostrarán a los participantes durante la sesión de seguimiento ocular.
                  </p>
                  
                  <div className="mt-4 space-y-4">
                    <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/*"
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <svg className="w-8 h-8 text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium">Haga clic para subir</span>
                          <span className="text-xs text-neutral-500 mt-1">PNG, JPG, WEBP hasta 10MB</span>
                        </div>
                      </label>
                    </div>

                    {/* Uploaded files section */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Estímulos seleccionados:</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border rounded-lg p-3 bg-neutral-50">
                          <div className="aspect-video bg-neutral-200 rounded-md mb-2 overflow-hidden">
                            <div className="h-full w-full flex items-center justify-center text-neutral-400">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-600 truncate">stimulus_1.jpg</span>
                            <button className="text-red-500 hover:text-red-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="border rounded-lg p-3 bg-neutral-50">
                          <div className="aspect-video bg-neutral-200 rounded-md mb-2 overflow-hidden">
                            <div className="h-full w-full flex items-center justify-center text-neutral-400">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-600 truncate">stimulus_2.jpg</span>
                            <button className="text-red-500 hover:text-red-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <Button
                          className="px-4 py-2 text-sm"
                        >
                          Subir archivos
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'preview' && (
            <>
              <header className="mb-6">
                <h1 className="text-lg font-semibold text-neutral-900">
                  Vista previa del experimento
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Previsualice cómo los participantes verán el experimento de eye tracking.
                </p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 font-medium">
                    Este flujo NO guarda datos. Es solo para previsualización.
                  </p>
                </div>
              </header>

              <div className="space-y-6">
                {/* Barra azul de navegación */}
                <div className="bg-blue-500 text-white p-3 rounded-t-lg flex items-center justify-between">
                  <span className="font-medium">Navegación del experimento</span>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                      Anterior
                    </button>
                    <button className="px-3 py-1 text-xs bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                      Siguiente
                    </button>
                  </div>
                </div>
                
                {/* Pantalla inicial común */}
                <div className="border border-neutral-200 rounded-b-lg">
                  <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                    <h3 className="text-sm font-medium">Pantalla inicial común</h3>
                  </div>
                  <div className="p-6 text-center">
                    <div className="max-w-md mx-auto">
                      <h2 className="text-xl font-semibold mb-4">Bienvenido al experimento de seguimiento ocular</h2>
                      <p className="text-neutral-600 mb-6">
                        A continuación, se le mostrarán una serie de imágenes. Por favor, observe cada imagen con naturalidad.
                        Sus movimientos oculares serán registrados para fines de investigación.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-blue-800">
                          Haga clic en "Comenzar" cuando esté listo para iniciar el experimento.
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Comenzar
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Información de secuencia del experimento */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Orden recomendado del estudio</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Generalmente, CX debe poner primero el bloque de "Smart VOC" y luego el de "Cognitive Task"
                  </p>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-2">1</span>
                      <span className="text-sm font-medium">Smart VOC</span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-2">2</span>
                      <span className="text-sm font-medium">Cognitive Task</span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-2">3</span>
                      <span className="text-sm font-medium">Eye Tracking</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-neutral-800 rounded-lg overflow-hidden">
                  <div className="aspect-video relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center">
                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">Haga clic para iniciar la previsualización</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-900">Secuencia de presentación</h3>
                    <select className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                      <option value="sequential">Secuencial</option>
                      <option value="random">Aleatorio</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-900">Duración por estímulo</h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={5}
                        min={1}
                        max={60}
                        className="w-full"
                      />
                      <span className="text-sm text-neutral-500">segundos</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'advanced' && (
            <>
              <header className="mb-6">
                <h1 className="text-lg font-semibold text-neutral-900">
                  Opciones avanzadas
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Configure parámetros avanzados de seguimiento ocular.
                </p>
              </header>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-900">Umbral de fijación</h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={config.fixationThreshold}
                        onChange={(e) => handleConfigChange('fixationThreshold', parseInt(e.target.value))}
                        min={50}
                        max={200}
                        className="w-full"
                      />
                      <span className="text-sm text-neutral-500">ms</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Tiempo mínimo que se considera una fijación ocular.</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-900">Umbral de velocidad para sacadas</h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={config.saccadeVelocityThreshold}
                        onChange={(e) => handleConfigChange('saccadeVelocityThreshold', parseInt(e.target.value))}
                        min={20}
                        max={100}
                        className="w-full"
                      />
                      <span className="text-sm text-neutral-500">°/s</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Velocidad mínima para detectar movimientos sacádicos.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-900">Áreas de interés (AOI)</h3>
                  <p className="text-sm text-neutral-500">
                    Configure las áreas de interés para el análisis de los datos de eye tracking.
                  </p>
                  
                  <div className="p-4 bg-neutral-50 rounded-lg mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-neutral-800">Habilitar áreas de interés</span>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
                        <div>
                          <span className="text-sm font-medium text-neutral-800">AOI 1: Área superior</span>
                          <p className="text-xs text-neutral-500 mt-0.5">Región: x:120, y:80, ancho:400, alto:200</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-500 hover:text-blue-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="text-red-500 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
                        <div>
                          <span className="text-sm font-medium text-neutral-800">AOI 2: Logo</span>
                          <p className="text-xs text-neutral-500 mt-0.5">Región: x:50, y:50, ancho:150, alto:80</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-500 hover:text-blue-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="text-red-500 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <button className="mt-3 w-full p-2 text-sm text-blue-500 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        + Añadir nueva área de interés
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="flex items-center justify-between px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">Los cambios se guardan automáticamente</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Vista previa
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Guardar y continuar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
} 