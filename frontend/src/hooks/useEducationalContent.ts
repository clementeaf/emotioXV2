import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { DYNAMIC_API_ENDPOINTS } from '@/api/dynamic-endpoints';

export interface EducationalContent {
  id: string;
  contentType: 'smart_voc' | 'cognitive_task';
  title: string;
  generalDescription: string;
  typeExplanation: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseEducationalContentReturn {
  smartVocContent: EducationalContent | null;
  cognitiveTaskContent: EducationalContent | null;
  loading: boolean;
  error: string | null;
  refreshContent: () => Promise<void>;
}

/**
 * Hook para gestionar el contenido educativo desde la API
 */
export const useEducationalContent = (): UseEducationalContentReturn => {
  const [smartVocContent, setSmartVocContent] = useState<EducationalContent | null>(null);
  const [cognitiveTaskContent, setCognitiveTaskContent] = useState<EducationalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEducationalContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = authService.getToken();
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
        const contents = data.data as EducationalContent[];
        
        const smartVoc = contents.find((c) => c.contentType === 'smart_voc');
        const cognitive = contents.find((c) => c.contentType === 'cognitive_task');
        
        setSmartVocContent(smartVoc || null);
        setCognitiveTaskContent(cognitive || null);
      } else {
        setError('Error al cargar el contenido educativo');
      }
    } catch (err) {
      console.error('Error loading educational content:', err);
      setError('Error al cargar el contenido educativo');
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = async () => {
    await loadEducationalContent();
  };

  useEffect(() => {
    loadEducationalContent();
  }, []);

  return {
    smartVocContent,
    cognitiveTaskContent,
    loading,
    error,
    refreshContent,
  };
};