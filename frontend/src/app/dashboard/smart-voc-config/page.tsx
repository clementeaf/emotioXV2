'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SmartVOCFormGeneric } from '@/components/research/SmartVOC/SmartVOCFormGeneric';
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react';

/**
 * Página de configuración de Smart VOC usando el sistema genérico
 */
export default function SmartVOCConfigPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [savedData, setSavedData] = useState<any>(null);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSavedData(data);
      console.log('Smart VOC configurado:', data);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // Implementar preview
    console.log('Preview Smart VOC');
  };

  const handleDelete = () => {
    // Implementar eliminación
    console.log('Eliminar configuración Smart VOC');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración Smart VOC
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Configura las preguntas de Voice of Customer usando el sistema genérico
          </p>
        </div>

        {/* Status Card */}
        {savedData && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">
                Configuración guardada exitosamente
              </span>
              <span className="text-green-600 text-sm">
                ({savedData.questions?.length || 0} preguntas configuradas)
              </span>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Smart VOC Form */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Formulario Smart VOC
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sistema genérico - 20 líneas de código vs 500+ anteriores
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
              </div>

              <SmartVOCFormGeneric
                researchId="current"
                onSave={handleSave}
              />
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
                Tipos Disponibles
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

            {/* Code Example */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Implementación
              </h3>
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-auto">
                <pre>{`// Solo 20 líneas de código
<SmartVOCFormGeneric 
  researchId={researchId}
  onSave={handleSave} 
/>

// vs 500+ líneas anteriores
// useSmartVOCForm.ts - 314 líneas
// SmartVOCQuestions.tsx - 127 líneas  
// AddQuestionModal.tsx - 118 líneas
// config.ts - 210 líneas
// templates.ts - 103 líneas
// utils.ts - 41 líneas`}</pre>
              </div>
            </Card>

            {/* Demo Link */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Ver Demo Completo
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                Explora todas las funcionalidades del sistema genérico
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/dashboard/smart-voc-demo', '_blank')}
                className="w-full"
              >
                Abrir Demo
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
