'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';
// Importemos estos tipos del archivo original, ya que parece que @emotiox/shared no está accesible
// en este entorno. Definimos estos enums aquí directamente.

enum EmotionIntensity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

enum EmotionCategory {
  BASIC = 'BASIC',
  SECONDARY = 'SECONDARY',
  TERTIARY = 'TERTIARY'
}

interface EmotionFormProps {
  emotionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  description: string;
  intensity: EmotionIntensity;
  category: EmotionCategory;
  tags: string[];
}

const initialFormData: FormData = {
  name: '',
  description: '',
  intensity: EmotionIntensity.MEDIUM,
  category: EmotionCategory.BASIC,
  tags: [],
};

export function EmotionForm({ emotionId, onSuccess, onCancel }: EmotionFormProps) {
  const { api } = useApi();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (emotionId) {
      loadEmotion();
    }
  }, [emotionId]);

  const loadEmotion = async () => {
    if (!emotionId) {return;}
    
    setLoading(true);
    try {
      const response = await api.emotions.getById(emotionId);
      if (response.data) {
        setFormData(response.data);
      }
    } catch (err) {
      setError('Error al cargar la emoción');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setLoading(true);

    try {
      if (emotionId) {
        await api.emotions.update(emotionId, formData);
      } else {
        await api.emotions.create(formData);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la emoción');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (formData.tags.length >= 5) {
        setError('Máximo 5 etiquetas permitidas');
        return;
      }
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (loading && emotionId) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900">
              {emotionId ? 'Editar emoción' : 'Crear nueva emoción'}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {emotionId ? 'Modifica los detalles de esta emoción' : 'Completa el formulario para crear una nueva emoción'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-900">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Nombre de la emoción"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-900">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                  maxLength={500}
                  placeholder="Describe esta emoción..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">
                    Intensidad
                  </label>
                  <select
                    value={formData.intensity}
                    onChange={e => setFormData(prev => ({ ...prev, intensity: e.target.value as EmotionIntensity }))}
                    className="w-full h-10 pl-3 pr-10 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {Object.values(EmotionIntensity).map(intensity => (
                      <option key={intensity} value={intensity}>
                        {intensity.charAt(0) + intensity.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-900">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as EmotionCategory }))}
                    className="w-full h-10 pl-3 pr-10 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {Object.values(EmotionCategory).map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0) + category.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-900">
                  Etiquetas <span className="text-neutral-500 text-xs">(máximo 5)</span>
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Escribe una etiqueta y presiona Enter para agregar"
                  maxLength={20}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 text-blue-400 hover:text-blue-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600">
                {error}
              </div>
            )}
          </form>
        </div>

        <footer className="flex items-center justify-end px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="px-4 py-2 text-sm font-medium"
            >
              {emotionId ? 'Actualizar' : 'Crear'} emoción
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
} 