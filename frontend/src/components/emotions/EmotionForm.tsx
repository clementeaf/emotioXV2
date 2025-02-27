'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmotionIntensity, EmotionCategory } from '@emotiox/shared';

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
    if (!emotionId) return;
    
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Nombre"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          maxLength={50}
          error={!!error}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full min-h-[100px] rounded-md border border-neutral-200 p-2"
            required
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Intensidad
          </label>
          <select
            value={formData.intensity}
            onChange={e => setFormData(prev => ({ ...prev, intensity: e.target.value as EmotionIntensity }))}
            className="w-full rounded-md border border-neutral-200 p-2"
          >
            {Object.values(EmotionIntensity).map(intensity => (
              <option key={intensity} value={intensity}>
                {intensity.charAt(0) + intensity.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Categoría
          </label>
          <select
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as EmotionCategory }))}
            className="w-full rounded-md border border-neutral-200 p-2"
          >
            {Object.values(EmotionCategory).map(category => (
              <option key={category} value={category}>
                {category.charAt(0) + category.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Etiquetas
          </label>
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Presiona Enter para agregar"
            maxLength={20}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          {emotionId ? 'Actualizar' : 'Crear'} emoción
        </Button>
      </div>
    </form>
  );
} 