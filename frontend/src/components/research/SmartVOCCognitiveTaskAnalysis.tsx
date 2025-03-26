'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SmartVOCCognitiveTaskAnalysisProps {
  className?: string;
}

interface CognitiveTaskResult {
  id: string;
  taskName: string;
  taskDescription: string;
  completed: number;
  totalParticipants: number;
  score: number;
  maxScore: number;
  averageTime: string;
  status: 'completed' | 'in-progress' | 'pending';
  subtasks?: {
    name: string;
    score: number;
    percentage: number;
  }[];
  heatmapUrl?: string;
}

export function SmartVOCCognitiveTaskAnalysis({ className }: SmartVOCCognitiveTaskAnalysisProps) {
  const [activeSection, setActiveSection] = useState<string>('all');
  
  // Datos simulados para los resultados de tareas cognitivas
  const cognitiveResults: CognitiveTaskResult[] = [
    {
      id: '1',
      taskName: 'Memoria de trabajo',
      taskDescription: 'Evaluación de la capacidad para mantener y manipular información a corto plazo.',
      completed: 245,
      totalParticipants: 256,
      score: 78,
      maxScore: 100,
      averageTime: '3:45',
      status: 'completed',
      subtasks: [
        { name: 'Recordar secuencia visual', score: 82, percentage: 82 },
        { name: 'Manipulación mental de objetos', score: 76, percentage: 76 },
        { name: 'Memoria numérica inversa', score: 73, percentage: 73 },
        { name: 'Actualización de información', score: 81, percentage: 81 }
      ],
      heatmapUrl: '/images/cognitive/memory-heatmap.jpg'
    },
    {
      id: '2',
      taskName: 'Atención selectiva',
      taskDescription: 'Mide la capacidad de enfocarse en estímulos relevantes mientras se ignoran distracciones.',
      completed: 238,
      totalParticipants: 256,
      score: 84,
      maxScore: 100,
      averageTime: '2:58',
      status: 'completed',
      subtasks: [
        { name: 'Búsqueda visual', score: 86, percentage: 86 },
        { name: 'Identificación de estímulos', score: 84, percentage: 84 },
        { name: 'Filtrado de distracciones', score: 81, percentage: 81 }
      ],
      heatmapUrl: '/images/cognitive/attention-heatmap.jpg'
    },
    {
      id: '3',
      taskName: 'Velocidad de procesamiento',
      taskDescription: 'Evalúa la rapidez con la que se procesa información visual y se toman decisiones.',
      completed: 230,
      totalParticipants: 256,
      score: 76,
      maxScore: 100,
      averageTime: '5:12',
      status: 'completed',
      subtasks: [
        { name: 'Tiempo de reacción simple', score: 79, percentage: 79 },
        { name: 'Comparación de símbolos', score: 74, percentage: 74 },
        { name: 'Codificación visual', score: 72, percentage: 72 },
        { name: 'Velocidad de escaneo', score: 78, percentage: 78 }
      ]
    },
    {
      id: '4',
      taskName: 'Flexibilidad cognitiva',
      taskDescription: 'Mide la capacidad de adaptar el comportamiento y pensamiento a nuevas situaciones o reglas.',
      completed: 235,
      totalParticipants: 256,
      score: 71,
      maxScore: 100,
      averageTime: '4:30',
      status: 'completed',
      subtasks: [
        { name: 'Cambio de reglas', score: 70, percentage: 70 },
        { name: 'Adaptación contextual', score: 73, percentage: 73 },
        { name: 'Categorización flexible', score: 69, percentage: 69 }
      ],
      heatmapUrl: '/images/cognitive/flexibility-heatmap.jpg'
    },
    {
      id: '5',
      taskName: 'Razonamiento lógico',
      taskDescription: 'Evalúa la capacidad de resolver problemas mediante el análisis y la lógica.',
      completed: 228,
      totalParticipants: 256,
      score: 81,
      maxScore: 100,
      averageTime: '6:15',
      status: 'completed',
      subtasks: [
        { name: 'Patrones visuales', score: 83, percentage: 83 },
        { name: 'Secuencias lógicas', score: 80, percentage: 80 },
        { name: 'Analogías', score: 79, percentage: 79 }
      ]
    }
  ];
  
  // Datos para gráficos de dispersión 
  const generateScatterData = () => {
    return Array.from({ length: 100 }, () => ({
      x: Math.floor(Math.random() * 100), 
      y: Math.floor(Math.random() * 100),
      cluster: Math.floor(Math.random() * 3)
    }));
  };
  
  const scatterData = {
    attentionScores: generateScatterData(),
    memoryScores: generateScatterData(),
    processingScores: generateScatterData()
  };
  
  // Renderiza una tarjeta de resumen para cada tarea cognitiva
  const renderTaskCard = (task: CognitiveTaskResult) => {
    return (
      <div key={task.id} className="bg-white p-6 rounded-lg border border-neutral-200 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-neutral-900">{task.id}. {task.taskName}</h3>
            <p className="text-sm text-neutral-600 mt-1">{task.taskDescription}</p>
          </div>
          
          <div className="flex items-center space-x-3 text-xs">
            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
              {task.completed}/{task.totalParticipants} completado
            </span>
            <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded">
              Tiempo promedio: {task.averageTime}
            </span>
            <Button variant="outline" size="sm">
              <span className="mr-1">Exportar</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-6">
          {/* Puntuación principal */}
          <div className="col-span-2 flex flex-col">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#eaeaea" 
                  strokeWidth="10" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke={task.score >= 80 ? '#4CAF50' : task.score >= 60 ? '#2196F3' : '#F44336'} 
                  strokeWidth="10" 
                  strokeDasharray={`${task.score * 2.83} ${283 - (task.score * 2.83)}`} 
                  strokeDashoffset="0" 
                  transform="rotate(-90 50 50)" 
                />
                <text 
                  x="50" 
                  y="50" 
                  dominantBaseline="middle" 
                  textAnchor="middle" 
                  fontSize="24" 
                  fontWeight="bold" 
                  fill={task.score >= 80 ? '#4CAF50' : task.score >= 60 ? '#2196F3' : '#F44336'}
                >
                  {task.score}
                </text>
                <text 
                  x="50" 
                  y="70" 
                  dominantBaseline="middle" 
                  textAnchor="middle" 
                  fontSize="12" 
                  fill="#666"
                >
                  de {task.maxScore}
                </text>
              </svg>
            </div>
            
            <div className="mt-4 text-sm text-neutral-700 text-center">
              <div className="flex items-center justify-center">
                <span className="text-green-500 mr-1">▲</span>
                <span>+3.2% vs grupo control</span>
              </div>
            </div>
          </div>
          
          {/* Subtareas y barras de progreso */}
          <div className="col-span-3">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">Rendimiento por subtarea</h4>
            {task.subtasks?.map((subtask, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-700">{subtask.name}</span>
                  <span className="text-sm font-medium text-neutral-700">{subtask.score}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div 
                    className={cn(
                      'h-2.5 rounded-full', 
                      subtask.percentage >= 80 ? 'bg-green-500' : 
                        subtask.percentage >= 60 ? 'bg-blue-500' : 
                          'bg-amber-500'
                    )}
                    style={{ width: `${subtask.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Visualización de resultados o heatmap */}
          <div className="col-span-2">
            {task.heatmapUrl ? (
              <div className="rounded-lg overflow-hidden h-full flex flex-col">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Patrón de respuesta</h4>
                <div className="bg-neutral-100 rounded-lg h-full min-h-[150px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 opacity-50"></div>
                  <div className="relative z-10 p-2">
                    <div className="bg-white/80 backdrop-blur-sm p-1 rounded-md text-xs text-center">
                      Vista previa de mapa de calor
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden h-full flex flex-col">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Distribución de respuestas</h4>
                <div className="bg-neutral-100 rounded-lg h-full min-h-[150px] flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-3/4 w-3/4 relative">
                      {/* Simulación simple de gráfico de dispersión */}
                      {scatterData.memoryScores.slice(0, 40).map((point, i) => (
                        <div 
                          key={i}
                          className={cn(
                            'absolute rounded-full w-1.5 h-1.5', 
                            point.cluster === 0 ? 'bg-blue-500' : 
                              point.cluster === 1 ? 'bg-purple-500' : 
                                'bg-green-500'
                          )}
                          style={{
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                            opacity: 0.7 + (Math.random() * 0.3)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="relative z-10 p-2">
                    <div className="bg-white/80 backdrop-blur-sm p-1 rounded-md text-xs text-center">
                      Simulación de dispersión
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Renderiza un gráfico de visualización de resultados
  const renderVisualizationSection = () => {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-neutral-900">Análisis de Patrones Cognitivos</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <span className="mr-1">Ver detalles</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Mapa de calor simulado */}
          <div className="rounded-lg overflow-hidden bg-neutral-100 h-64 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 opacity-50"></div>
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
              {Array.from({ length: 25 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div 
                    key={i} 
                    className="relative"
                    style={{
                      backgroundColor: `rgba(79, 70, 229, ${intensity * 0.4})`,
                      borderRadius: '4px'
                    }}
                  />
                );
              })}
            </div>
            <div className="relative z-10 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-neutral-800 mb-1">Mapa de atención</h4>
              <p className="text-xs text-neutral-600">Patrón de observación durante las tareas</p>
            </div>
          </div>
          
          {/* Gráfico de dispersión simulado */}
          <div className="rounded-lg overflow-hidden bg-white h-64 border border-neutral-200 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4/5 w-4/5 relative">
                {/* Ejes X e Y */}
                <div className="absolute left-0 bottom-0 h-full w-px bg-neutral-300"></div>
                <div className="absolute left-0 bottom-0 h-px w-full bg-neutral-300"></div>
                
                {/* Etiquetas de ejes */}
                <div className="absolute left-1/2 bottom-[-20px] transform -translate-x-1/2 text-xs text-neutral-500">
                  Velocidad de procesamiento
                </div>
                <div className="absolute left-[-25px] top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-neutral-500">
                  Precisión
                </div>
                
                {/* Puntos del gráfico de dispersión */}
                {scatterData.processingScores.slice(0, 70).map((point, i) => (
                  <div 
                    key={i}
                    className={cn(
                      'absolute rounded-full', 
                      point.cluster === 0 ? 'bg-blue-500' : 
                        point.cluster === 1 ? 'bg-purple-500' : 
                          'bg-pink-500'
                    )}
                    style={{
                      left: `${point.x}%`,
                      bottom: `${point.y}%`,
                      width: '5px',
                      height: '5px',
                      opacity: 0.7 + (Math.random() * 0.3)
                    }}
                  />
                ))}
                
                {/* Leyenda */}
                <div className="absolute top-2 right-2 text-xs">
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    <span>Grupo A</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
                    <span>Grupo B</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-pink-500 mr-1"></div>
                    <span>Grupo C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar la sección de seguimiento ocular
  const renderEyeTrackingSection = () => {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-neutral-900">Análisis de Seguimiento Ocular</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Patrones de atención visual durante las tareas cognitivas
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <span className="mr-1">Ver completo</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </Button>
          </div>
        </div>
        
        <div className="relative bg-neutral-100 rounded-lg h-96 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-neutral-800 opacity-5"></div>
          
          {/* Interfaz simulada con overlay de mapa de calor */}
          <div className="relative bg-white w-3/4 h-3/4 rounded shadow-lg overflow-hidden flex flex-col">
            <div className="bg-indigo-600 h-8 flex items-center px-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <div className="flex-1"></div>
              <div className="w-20 h-4 bg-neutral-200 rounded"></div>
            </div>
            
            <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-2 p-4 relative">
              {/* Elementos de UI simulados */}
              <div className="col-span-4 row-span-3 bg-neutral-100 rounded"></div>
              <div className="col-span-8 row-span-2 bg-neutral-100 rounded"></div>
              <div className="col-span-3 row-span-1 bg-neutral-100 rounded"></div>
              <div className="col-span-5 row-span-1 bg-neutral-100 rounded"></div>
              <div className="col-span-6 row-span-3 bg-neutral-100 rounded"></div>
              <div className="col-span-6 row-span-3 bg-neutral-100 rounded"></div>
              
              {/* Superposición de mapa de calor */}
              <div className="absolute inset-0" style={{ mixBlendMode: 'multiply' }}>
                {/* Puntos de fijación simulados */}
                <div className="absolute left-1/4 top-1/3 w-16 h-16 rounded-full bg-red-500 opacity-40 blur-md"></div>
                <div className="absolute left-2/3 top-1/4 w-20 h-20 rounded-full bg-red-500 opacity-30 blur-md"></div>
                <div className="absolute left-1/2 top-3/4 w-12 h-12 rounded-full bg-red-500 opacity-35 blur-md"></div>
                <div className="absolute left-3/4 top-2/3 w-16 h-16 rounded-full bg-red-500 opacity-25 blur-md"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm text-xs">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-80 mr-1"></div>
              <span>Alta concentración</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80 mr-1"></div>
              <span>Media concentración</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-80 mr-1"></div>
              <span>Baja concentración</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderiza un resumen de puntajes general
  const renderSummarySection = () => {
    const averageScore = Math.round(cognitiveResults.reduce((sum, task) => sum + task.score, 0) / cognitiveResults.length);
    
    return (
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-700">Rendimiento Promedio</h3>
          <div className="mt-2 flex items-center">
            <span className="text-2xl font-bold text-neutral-900">{averageScore}</span>
            <span className="text-sm text-green-600 ml-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              +2.5%
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">vs. promedio de grupo</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-700">Tasa de Finalización</h3>
          <div className="mt-2 flex items-center">
            <span className="text-2xl font-bold text-neutral-900">92%</span>
            <span className="text-sm text-green-600 ml-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              +3.8%
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">vs. promedio histórico</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-700">Tiempo Promedio</h3>
          <div className="mt-2 flex items-center">
            <span className="text-2xl font-bold text-neutral-900">4:32</span>
            <span className="text-sm text-red-600 ml-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
              </svg>
              +0:12
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">vs. última evaluación</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-700">Tasa de Error</h3>
          <div className="mt-2 flex items-center">
            <span className="text-2xl font-bold text-neutral-900">13%</span>
            <span className="text-sm text-green-600 ml-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
              </svg>
              -2.1%
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">vs. promedio de grupo</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={cn('mt-6 mb-10', className)}>
      {/* Encabezado y filtros */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          Análisis de Tareas Cognitivas
        </h2>
        
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <span className="mr-2">Filtrar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </Button>
          <Button variant="outline" size="sm">
            <span className="mr-2">Exportar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Tarjetas de resumen */}
      {renderSummarySection()}
      
      {/* Secciones de cada tarea cognitiva */}
      {cognitiveResults.map(renderTaskCard)}
      
      {/* Sección de visualización de resultados */}
      {renderVisualizationSection()}
      
      {/* Sección de seguimiento ocular */}
      {renderEyeTrackingSection()}
    </div>
  );
} 