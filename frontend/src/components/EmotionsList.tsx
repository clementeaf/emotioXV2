'use client';

import { Emotion } from '@/types/shared-types';
import { useCallback, useEffect, useReducer, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';

import { EmotionForm } from './emotions/EmotionForm';

interface EmotionsState {
  emotions: Emotion[];
  loading: boolean;
  error?: string;
}

type EmotionsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Emotion[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'DELETE_SUCCESS'; payload: string }
  | { type: 'UPDATE_SUCCESS'; payload: Emotion }
  | { type: 'CREATE_SUCCESS'; payload: Emotion };

const initialState: EmotionsState = {
  emotions: [],
  loading: false,
};

function emotionsReducer(state: EmotionsState, action: EmotionsAction): EmotionsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: undefined };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, emotions: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'DELETE_SUCCESS':
      return {
        ...state,
        emotions: state.emotions.filter(emotion => emotion.id !== action.payload),
      };
    case 'UPDATE_SUCCESS':
      return {
        ...state,
        emotions: state.emotions.map(emotion =>
          emotion.id === action.payload.id ? action.payload : emotion
        ),
      };
    case 'CREATE_SUCCESS':
      return {
        ...state,
        emotions: [...state.emotions, action.payload],
      };
    default:
      return state;
  }
}

export function EmotionsList() {
  const { api } = useApi();
  const [state, dispatch] = useReducer(emotionsReducer, initialState);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  const loadEmotions = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    // <<< Comentar llamada a API >>>
    /*
    const result = await api.emotions.getAll();

    if (result.error) {
      dispatch({ type: 'FETCH_ERROR', payload: result.error });
    } else {
      dispatch({ type: 'FETCH_SUCCESS', payload: result.data || [] });
    }
    */
    // Placeholder para simular carga y posible error
    // console.log('Funcionalidad loadEmotions comentada temporalmente');
    dispatch({ type: 'FETCH_ERROR', payload: 'Carga de emociones deshabilitada temporalmente' });

  //}, [api.emotions]); // <<< Eliminar dependencia
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta emoción?')) {
      return;
    }

    // <<< Comentar llamada a API >>>
    /*
    const result = await api.emotions.delete(id);
    if (!result.error) {
      dispatch({ type: 'DELETE_SUCCESS', payload: id });
    }
    */
    // console.log('Funcionalidad handleDelete comentada temporalmente');
    // Simular que no se pudo borrar

  //}, [api.emotions]); // <<< Eliminar dependencia
  }, []);

  const handleEdit = (emotion: Emotion) => {
    setEditingId(emotion.id);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingId(undefined);
    loadEmotions();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingId(undefined);
  };

  useEffect(() => {
    loadEmotions();
  }, [loadEmotions]);

  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {editingId ? 'Editar emoción' : 'Nueva emoción'}
          </h2>
          <Button variant="ghost" onClick={handleFormCancel}>
            Volver
          </Button>
        </div>
        <EmotionForm
          emotionId={editingId}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lista de Emociones</h2>
        <Button onClick={() => setShowForm(true)}>
          Nueva emoción
        </Button>
      </div>

      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">Error: {state.error}</p>
          <button
            onClick={loadEmotions}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {state.emotions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No hay emociones registradas
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {state.emotions.map(emotion => (
            <div
              key={emotion.id}
              className="bg-white rounded-lg shadow-md p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium">{emotion.name}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(emotion)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(emotion.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>

              <p className="text-gray-600">{emotion.description}</p>

              <div className="flex gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {emotion.intensity.toLowerCase()}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {emotion.category.toLowerCase()}
                </span>
              </div>

              {emotion.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {emotion.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
