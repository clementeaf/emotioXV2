'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'react-hot-toast';

// Definir localmente los valores por defecto para evitar problemas de importación
const DEFAULT_CONFIG = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: 'Start Research'
};

// Define el tipo localmente
interface WelcomeScreenData {
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
}

interface WelcomeScreenFormProps {
  className?: string;
  researchId: string;
}

export function WelcomeScreenForm({ className, researchId }: WelcomeScreenFormProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<WelcomeScreenData>({
    isEnabled: DEFAULT_CONFIG.isEnabled,
    title: DEFAULT_CONFIG.title,
    message: DEFAULT_CONFIG.message,
    startButtonText: DEFAULT_CONFIG.startButtonText
  });
  
  // Determinar si estamos en modo desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    if (!researchId) return;
    
    const fetchWelcomeScreen = async () => {
      try {
        setIsLoading(true);
        
        // URL del endpoint basada en si estamos en desarrollo o producción
        const apiUrl = isDevelopment 
          ? `/api/debug/welcome-screen/${researchId}` 
          : `/api/proxy/research/${researchId}/welcome-screen`;
        
        console.log('Fetching welcome screen from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setFormData({
              isEnabled: data.data.isEnabled,
              title: data.data.title,
              message: data.data.message,
              startButtonText: data.data.startButtonText
            });
          }
        } else {
          console.log('No welcome screen configuration found. Using defaults.');
        }
      } catch (error) {
        console.error('Error fetching welcome screen:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWelcomeScreen();
  }, [researchId, token, isDevelopment]);

  // Manejar cambios en el formulario
  const handleChange = (field: keyof WelcomeScreenData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Guardar datos del formulario
  const handleSave = async () => {
    if (!researchId) {
      toast.error('Research ID is required');
      return;
    }

    try {
      setIsLoading(true);
      
      // URL del endpoint basada en si estamos en desarrollo o producción
      const apiUrl = isDevelopment 
        ? `/api/debug/welcome-screen/${researchId}` 
        : `/api/proxy/research/${researchId}/welcome-screen`;
      
      console.log('Saving welcome screen to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          researchId,
          ...formData
        })
      });
      
      if (response.ok) {
        toast.success('Welcome screen saved successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error saving welcome screen');
      }
    } catch (error) {
      console.error('Error saving welcome screen:', error);
      toast.error('Failed to save welcome screen');
    } finally {
      setIsLoading(false);
    }
  };

  // Vista previa del formulario
  const handlePreview = () => {
    // Implementar lógica de vista previa
    toast.success('Preview functionality coming soon!');
  };

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)]">
        <div className="px-6 py-6">
          <header className="mb-4">
            <h1 className="text-lg font-semibold text-neutral-900">
              1.0 - Welcome screen
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure the initial screen that participants will see when starting the research.
            </p>
          </header>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="space-y-0.5">
                <h2 className="text-sm font-medium text-neutral-900">Enable Welcome Screen</h2>
                <p className="text-sm text-neutral-500">Show a welcome message to participants before starting the research.</p>
              </div>
              <Switch 
                checked={formData.isEnabled}
                onCheckedChange={(checked: boolean) => handleChange('isEnabled', checked)}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="title" className="block text-sm font-medium text-neutral-900">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter a title for your welcome screen..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-neutral-900">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Write a welcome message for your participants..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="buttonText" className="block text-sm font-medium text-neutral-900">
                  Start Button Text
                </label>
                <input
                  type="text"
                  id="buttonText"
                  value={formData.startButtonText}
                  onChange={(e) => handleChange('startButtonText', e.target.value)}
                  placeholder="e.g., 'Start Research', 'Begin', 'Continue'"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  The text that will appear on the button to start the research.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between px-6 py-3 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">
            {isLoading ? 'Saving...' : 'Changes will be saved when you click Save'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
} 