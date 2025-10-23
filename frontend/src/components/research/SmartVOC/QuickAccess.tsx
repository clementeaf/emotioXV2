import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BarChart3, 
  Settings, 
  Eye, 
  Code, 
  Zap,
  ArrowRight 
} from 'lucide-react';

/**
 * Componente de acceso rápido al sistema Smart VOC genérico
 */
export const QuickAccess: React.FC = () => {
  const quickActions = [
    {
      title: 'Configurar Smart VOC',
      description: 'Usar el sistema genérico para configurar preguntas',
      icon: Settings,
      href: '/dashboard/smart-voc-config',
      color: 'blue'
    },
    {
      title: 'Ver Demo Completo',
      description: 'Explorar todas las funcionalidades del sistema',
      icon: Eye,
      href: '/dashboard/smart-voc-demo',
      color: 'green'
    },
    {
      title: 'Código Genérico',
      description: 'Ver implementación del sistema genérico',
      icon: Code,
      href: '/dashboard/smart-voc-demo?tab=comparison',
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Smart VOC - Sistema Genérico
          </h2>
        </div>
        <p className="text-gray-600">
          Sistema completamente refactorizado usando hook genérico y JSON schema dinámico
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-${action.color}-100`}>
                  <Icon className={`w-6 h-6 text-${action.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {action.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(action.href, '_blank')}
                    className="w-full flex items-center gap-2"
                  >
                    Acceder
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* System Benefits */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Beneficios del Sistema Genérico
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Código reducido 95% (500+ → 20 líneas)</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Mantenimiento simplificado</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">UX consistente en todos los módulos</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Escalabilidad infinita</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Implementación
            </h3>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs">
              <pre>{`// Sistema anterior: 500+ líneas
// 8+ archivos, código duplicado

// Sistema genérico: 20 líneas
<SmartVOCFormGeneric 
  researchId={researchId}
  onSave={handleSave} 
/>

// Mismo patrón para cualquier módulo:
// CognitiveTask, EyeTracking, etc.`}</pre>
            </div>
          </div>
        </div>
      </Card>

      {/* Usage Instructions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cómo Usar el Sistema
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Acceder a la Configuración</h4>
              <p className="text-sm text-gray-600">
                Usa "Configurar Smart VOC" para acceder al formulario genérico
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Agregar Preguntas</h4>
              <p className="text-sm text-gray-600">
                Selecciona el tipo de pregunta (CSAT, CES, CV, NEV, NPS, VOC) y configura los campos
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Preview y Guardar</h4>
              <p className="text-sm text-gray-600">
                Ve el preview en tiempo real y guarda la configuración
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
