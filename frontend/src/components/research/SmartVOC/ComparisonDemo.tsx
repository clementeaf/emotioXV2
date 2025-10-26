import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SmartVOCFormGeneric } from './SmartVOCFormGeneric';
import { DynamicQuestionForm } from '../shared';
import { 
  Clock, 
  Code, 
  FileText, 
  Zap, 
  CheckCircle, 
  XCircle,
  ArrowRight
} from 'lucide-react';

/**
 * Componente de comparación entre sistema antiguo y nuevo
 */
export const ComparisonDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'old' | 'new'>('new');

  const comparisonData = {
    old: {
      title: 'Sistema Anterior',
      color: 'red',
      icon: XCircle,
      metrics: {
        lines: '500+ líneas',
        files: '8+ archivos',
        maintenance: 'Complejo',
        consistency: 'Variable',
        scalability: 'Limitada'
      },
      features: [
        'Configuración hardcodeada',
        'Código duplicado',
        'Mantenimiento manual',
        'UX inconsistente',
        'Difícil escalar'
      ]
    },
    new: {
      title: 'Sistema Genérico',
      color: 'green',
      icon: CheckCircle,
      metrics: {
        lines: '20 líneas',
        files: '1 archivo',
        maintenance: 'Simple',
        consistency: 'Uniforme',
        scalability: 'Ilimitada'
      },
      features: [
        'JSON schema dinámico',
        'Hook genérico reutilizable',
        'Mantenimiento automático',
        'UX consistente',
        'Escalabilidad infinita'
      ]
    }
  };

  const current = comparisonData[activeTab];
  const Icon = current.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Comparación de Sistemas
        </h2>
        <p className="text-lg text-gray-600">
          Ve las diferencias entre el sistema anterior y el nuevo sistema genérico
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('old')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'old'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sistema Anterior
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sistema Genérico
          </button>
        </div>
      </div>

      {/* Comparison Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Metrics */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Icon className={`w-6 h-6 text-${current.color}-600`} />
            <h3 className="text-xl font-semibold text-gray-900">
              {current.title}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Líneas de código</span>
                </div>
                <div className={`text-2xl font-bold text-${current.color}-600`}>
                  {current.metrics.lines}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Archivos</span>
                </div>
                <div className={`text-2xl font-bold text-${current.color}-600`}>
                  {current.metrics.files}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Mantenimiento</span>
                </div>
                <div className={`text-lg font-semibold text-${current.color}-600`}>
                  {current.metrics.maintenance}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Escalabilidad</span>
                </div>
                <div className={`text-lg font-semibold text-${current.color}-600`}>
                  {current.metrics.scalability}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Características
          </h3>
          <div className="space-y-3">
            {current.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-2 h-2 bg-${current.color}-500 rounded-full`}></div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Live Demo */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <ArrowRight className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Demo en Vivo
          </h3>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          {activeTab === 'new' ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Sistema genérico - Solo 20 líneas de código
              </div>
              <SmartVOCFormGeneric
                researchId="demo-comparison"
                onSave={(data) => console.log('Generic system saved:', data)}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                Sistema anterior - 500+ líneas de código
              </div>
              <div className="text-sm text-gray-400">
                (Componente legacy no mostrado para comparación)
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Code Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Código Anterior
          </h3>
          <div className="bg-red-50 p-4 rounded-lg">
            <pre className="text-xs text-red-800 overflow-auto max-h-40">
{`// Sistema anterior eliminado - hooks específicos obsoletos
// useSmartVOCForm.ts - 314 líneas (ELIMINADO)
// SmartVOCQuestions.tsx - 127 líneas (ELIMINADO)
// AddQuestionModal.tsx - 118 líneas (ELIMINADO)

// Ahora usa useFormManager + DynamicForm
export const SmartVOCFormGeneric: React.FC<SmartVOCFormGenericProps> = ({
  researchId, onSave
}) => {
  // ... 120+ líneas más
};

// Total: 500+ líneas, 8+ archivos (ELIMINADOS)
// Ahora: 1 archivo, 20 líneas con useFormManager`}
            </pre>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Código Genérico
          </h3>
          <div className="bg-green-50 p-4 rounded-lg">
            <pre className="text-xs text-green-800 overflow-auto max-h-40">
{`// SmartVOCFormGeneric.tsx - 20 líneas
export const SmartVOCFormGeneric: React.FC<SmartVOCFormGenericProps> = ({
  researchId, className, onSave
}) => {
  return (
    <DynamicQuestionForm
      moduleType="smart-voc"
      researchId={researchId}
      className={className}
      onSave={onSave}
      educationalContentKey="smartVocContent"
    />
  );
};

// JSON Schema - Configuración dinámica
// Hook genérico - Reutilizable
// Componentes genéricos - Universales
// Total: 20 líneas, 1 archivo`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};
