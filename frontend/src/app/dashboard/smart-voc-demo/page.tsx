'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { SmartVOCFormGeneric } from '@/components/research/SmartVOC/SmartVOCFormGeneric'; // Componente eliminado
// import { DynamicQuestionForm } from '@/components/research/shared'; // Módulo eliminado
// import { ComparisonDemo } from '@/components/research/SmartVOC/ComparisonDemo'; // Componente eliminado
import { BarChart3, Code, Settings, Eye, GitCompare } from 'lucide-react';

/**
 * Página de demostración del Smart VOC genérico
 * Muestra el nuevo sistema en acción
 */
export default function SmartVOCDemoPage() {
  const [activeDemo, setActiveDemo] = useState<'smart-voc' | 'direct' | 'comparison'>('smart-voc');
  const [demoData, setDemoData] = useState<any>(null);

  const handleSave = (data: any) => {
    setDemoData(data);
    console.log('Smart VOC Data Saved:', data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Smart VOC - Sistema Genérico
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Demostración del nuevo sistema genérico de formularios dinámicos
          </p>
        </div>

        {/* Demo Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveDemo('smart-voc')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeDemo === 'smart-voc'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Smart VOC Wrapper
                </div>
              </button>
              <button
                onClick={() => setActiveDemo('direct')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeDemo === 'direct'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Direct Generic Form
                </div>
              </button>
              <button
                onClick={() => setActiveDemo('comparison')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeDemo === 'comparison'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  Comparación
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Demo Content */}
        {activeDemo === 'comparison' ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">ComparisonDemo eliminado - usar SmartVOCForm con DynamicForm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Demo Area */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {activeDemo === 'smart-voc' ? 'Smart VOC Wrapper' : 'Direct Generic Form'}
                  </h2>
                </div>

                {activeDemo === 'smart-voc' ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">SmartVOCFormGeneric eliminado - usar SmartVOCForm con DynamicForm</p>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">DynamicQuestionForm eliminado - usar SmartVOCForm con DynamicForm</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* System Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sistema Genérico
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Hook genérico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">JSON schema dinámico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">CRUD completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Preview en tiempo real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Validación automática</span>
                  </div>
                </div>
              </Card>

              {/* Question Types */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tipos de Preguntas
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'CSAT', name: 'CSAT', desc: 'Satisfacción del cliente' },
                    { id: 'CES', name: 'CES', desc: 'Esfuerzo del cliente' },
                    { id: 'CV', name: 'CV', desc: 'Valor del cliente' },
                    { id: 'NEV', name: 'NEV', desc: 'Valor emocional' },
                    { id: 'NPS', name: 'NPS', desc: 'Promotor neto' },
                    { id: 'VOC', name: 'VOC', desc: 'Voz del cliente' }
                  ].map((type) => (
                    <div key={type.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">{type.name}</span>
                      <span className="text-xs text-gray-500">- {type.desc}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Demo Data */}
              {demoData && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Datos Guardados
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                      {JSON.stringify(demoData, null, 2)}
                    </pre>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    {demoData.questions?.length || 0} preguntas configuradas
                  </div>
                </Card>
              )}

              {/* Code Example */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Uso del Código
                </h3>
                <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-auto">
                  <pre>{`// Smart VOC Wrapper - SmartVOCFormGeneric eliminado
<SmartVOCForm 
  researchId={researchId}
  onSave={handleSave} 
/>

// Direct Generic Form - DynamicQuestionForm eliminado
{/* <DynamicQuestionForm
  moduleType="smart-voc"
  researchId={researchId}
  onSave={handleSave}
/>`}</pre>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              i
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Sistema Genérico Implementado
              </h4>
              <p className="text-blue-800 text-sm">
                Este demo muestra el nuevo sistema genérico en acción. 
                El mismo código funciona para Smart VOC, Cognitive Task, Eye Tracking y cualquier módulo futuro.
                Solo cambia el <code className="bg-blue-200 px-1 rounded">moduleType</code> en el JSON schema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
