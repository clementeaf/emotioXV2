'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { DYNAMIC_API_ENDPOINTS } from '@/api/dynamic-endpoints';

interface EducationalContent {
  id: string;
  contentType: 'smart_voc' | 'cognitive_task';
  title: string;
  generalDescription: string;
  typeExplanation: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Página de Configuraciones del Dashboard
 */
export default function SettingsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para los valores de los inputs
  const [smartVocDescription, setSmartVocDescription] = useState('');
  const [smartVocExplanation, setSmartVocExplanation] = useState('');
  const [cognitiveDescription, setCognitiveDescription] = useState('');
  const [cognitiveExplanation, setCognitiveExplanation] = useState('');

  useEffect(() => {
    loadEducationalContent();
  }, []);

  const loadEducationalContent = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        setError('No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch(`${DYNAMIC_API_ENDPOINTS.http}/educational-content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const contents = data.data;
        
        const smartVoc = contents.find((c: EducationalContent) => c.contentType === 'smart_voc');
        const cognitive = contents.find((c: EducationalContent) => c.contentType === 'cognitive_task');
        
        if (smartVoc) {
          setSmartVocDescription(smartVoc.generalDescription);
          setSmartVocExplanation(smartVoc.typeExplanation);
        }
        
        if (cognitive) {
          setCognitiveDescription(cognitive.generalDescription);
          setCognitiveExplanation(cognitive.typeExplanation);
        }
      } else {
        setError('Error al cargar el contenido educativo');
      }
    } catch (error) {
      console.error('Error loading educational content:', error);
      setError('Error al cargar el contenido educativo');
    } finally {
      setLoading(false);
    }
  };

  const saveEducationalContent = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (!token) {
        setError('No se pudo obtener el token de autenticación');
        return;
      }

      // Guardar SmartVOC content
      await fetch(`${DYNAMIC_API_ENDPOINTS.http}/educational-content/smart_voc`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generalDescription: smartVocDescription,
          typeExplanation: smartVocExplanation,
        }),
      });

      // Guardar Cognitive Task content
      await fetch(`${DYNAMIC_API_ENDPOINTS.http}/educational-content/cognitive_task`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generalDescription: cognitiveDescription,
          typeExplanation: cognitiveExplanation,
        }),
      });

      // Recargar el contenido después de guardar
      await loadEducationalContent();
      
    } catch (error) {
      console.error('Error saving educational content:', error);
      setError('Error al guardar el contenido educativo');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="liquid-glass flex-1 mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] flex flex-col justify-start overflow-y-auto">
      <div className="px-6 py-8 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuraciones</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Gestiona las configuraciones generales del sistema
          </p>
        </div>

        <div className="space-y-6">
          {/* Configuración de Información Educativa */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información Educativa de Formularios
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Configura el contenido educativo que aparece en las columnas laterales para explicar qué se está configurando y para qué sirve cada pregunta
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Cargando contenido educativo...</span>
              </div>
            ) : (
            <div className="space-y-8">
              {/* SmartVOC Educational Content */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  SmartVOC - Contenido Educativo
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción General de SmartVOC
                    </label>
                    <textarea
                      rows={3}
                      value={smartVocDescription}
                      onChange={(e) => setSmartVocDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Explica qué es SmartVOC y para qué sirve"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explicación de Tipos de Preguntas
                    </label>
                    <textarea
                      rows={4}
                      value={smartVocExplanation}
                      onChange={(e) => setSmartVocExplanation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe para qué sirve cada tipo de pregunta SmartVOC"
                    />
                  </div>
                </div>
              </div>

              {/* Cognitive Task Educational Content */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Cognitive Task - Contenido Educativo
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción General de Cognitive Task
                    </label>
                    <textarea
                      rows={3}
                      value={cognitiveDescription}
                      onChange={(e) => setCognitiveDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Explica qué son las Tareas Cognitivas y para qué sirven"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explicación de Tipos de Tareas
                    </label>
                    <textarea
                      rows={4}
                      value={cognitiveExplanation}
                      onChange={(e) => setCognitiveExplanation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe los diferentes tipos de tareas cognitivas y su propósito"
                    />
                  </div>
                </div>
              </div>
              
              {/* Botón de Guardar */}
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={saveEducationalContent}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Contenido Educativo'
                  )}
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}