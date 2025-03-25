'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { welcomeScreenAPI } from '@/config/alova.config';

// Definir localmente los valores por defecto para evitar problemas de importación
const DEFAULT_CONFIG = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: 'Start Research'
};

// Define el tipo localmente
interface WelcomeScreenData {
  id?: string;
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
}

// Tipo para la respuesta de la API
interface WelcomeScreenResponse {
  data?: WelcomeScreenData;
  error?: string;
  success?: boolean;
  id?: string;
}

interface WelcomeScreenFormProps {
  className?: string;
  researchId: string;
}

export function WelcomeScreenForm({ className, researchId }: WelcomeScreenFormProps) {
  console.log('DEBUG: WelcomeScreenForm inicializado con researchId:', researchId);
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<WelcomeScreenData>({
    isEnabled: DEFAULT_CONFIG.isEnabled,
    title: DEFAULT_CONFIG.title,
    message: DEFAULT_CONFIG.message,
    startButtonText: DEFAULT_CONFIG.startButtonText
  });
  // Guardar el ID si ya existe un welcome screen
  const [welcomeScreenId, setWelcomeScreenId] = useState<string | null>(null);
  // Estado para errores de validación
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Consultar datos de welcome screen existentes
  const { isLoading: isLoadingData, data: welcomeScreenData } = useQuery({
    queryKey: ['welcomeScreen', researchId] as const,
    queryFn: async () => {
      console.log('DEBUG: Ejecutando consulta para obtener welcome screen con researchId:', researchId);
      try {
        const response = await welcomeScreenAPI.getByResearchId(researchId).send();
        console.log('DEBUG: Respuesta de consulta welcome screen:', response);
        return response as WelcomeScreenResponse;
      } catch (error) {
        console.error('DEBUG: Error al consultar welcome screen:', error);
        throw error;
      }
    },
    enabled: !!researchId && !!token
  });

  // Actualizar el formulario cuando se reciben datos
  useEffect(() => {
    console.log('DEBUG: useEffect welcomeScreenData cambió:', welcomeScreenData);
    if (welcomeScreenData?.data) {
      console.log('DEBUG: Actualizando formulario con datos existentes:', welcomeScreenData.data);
      // Si tenemos un ID en la respuesta, guardarlo
      if (welcomeScreenData.data.id) {
        setWelcomeScreenId(welcomeScreenData.data.id);
        console.log('DEBUG: Welcome screen ID guardado:', welcomeScreenData.data.id);
      }
      setFormData({
        isEnabled: welcomeScreenData.data.isEnabled,
        title: welcomeScreenData.data.title,
        message: welcomeScreenData.data.message,
        startButtonText: welcomeScreenData.data.startButtonText
      });
      console.log('Welcome screen data loaded successfully');
    } else if (welcomeScreenData) {
      console.log('DEBUG: No se encontraron datos de welcome screen, usando valores por defecto');
      setWelcomeScreenId(null);
      console.log('No welcome screen configuration found. Using defaults.');
    }
  }, [welcomeScreenData]);

  // Validar el formulario
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Solo validar si está habilitado
    if (formData.isEnabled) {
      if (!formData.title.trim()) {
        errors.title = 'El título es obligatorio';
      } else if (formData.title.length < 3) {
        errors.title = 'El título debe tener al menos 3 caracteres';
      }
      
      if (!formData.message.trim()) {
        errors.message = 'El mensaje es obligatorio';
      } else if (formData.message.length < 10) {
        errors.message = 'El mensaje debe tener al menos 10 caracteres';
      }
      
      if (!formData.startButtonText.trim()) {
        errors.startButtonText = 'El texto del botón es obligatorio';
      } else if (formData.startButtonText.length < 2) {
        errors.startButtonText = 'El texto del botón debe tener al menos 2 caracteres';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Mutación para guardar el formulario
  const { mutate: saveWelcomeScreen, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      console.log('DEBUG: Guardando welcome screen con datos:', data);
      try {
        let response;
        
        // Si tenemos un ID, actualizar el registro existente
        if (welcomeScreenId) {
          console.log(`DEBUG: Actualizando welcome screen con ID ${welcomeScreenId}`);
          response = await welcomeScreenAPI.update(welcomeScreenId, data).send();
        } else {
          // Si no tenemos ID, crear un nuevo registro
          console.log('DEBUG: Creando nuevo welcome screen');
          response = await welcomeScreenAPI.create(data).send();
        }
        
        console.log('DEBUG: Respuesta al guardar welcome screen:', response);
        
        // Convertir la respuesta a WelcomeScreenResponse
        const typedResponse = response as WelcomeScreenResponse;
        
        // Si la respuesta incluye un ID y no teníamos uno, guardarlo
        if (typedResponse && typedResponse.id && !welcomeScreenId) {
          setWelcomeScreenId(typedResponse.id);
          console.log('DEBUG: Nuevo welcome screen ID guardado:', typedResponse.id);
        }
        
        return typedResponse;
      } catch (error) {
        console.error('DEBUG: Error al guardar welcome screen:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('DEBUG: Welcome screen guardada exitosamente', data);
      toast.success('Pantalla de bienvenida guardada exitosamente');
      // Invalidar la consulta para recargar los datos
      queryClient.invalidateQueries({ queryKey: ['welcomeScreen', researchId] });
    },
    onError: (error: Error) => {
      console.error('Error saving welcome screen:', error);
      toast.error(error.message || 'Error al guardar la pantalla de bienvenida');
    }
  });

  // Manejar cambios en el formulario
  const handleChange = (field: keyof WelcomeScreenData, value: any) => {
    // Limpiar error de validación al cambiar el campo
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Guardar datos del formulario
  const handleSave = () => {
    if (!researchId) {
      toast.error('Se requiere el ID de la investigación');
      return;
    }

    // Validar el formulario antes de enviar
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }

    const requestData = {
      researchId,
      ...formData
    };
    
    saveWelcomeScreen(requestData);
  };

  // Vista previa del formulario
  const handlePreview = () => {
    // Implementar lógica de vista previa
    toast.success('Vista previa próximamente!');
  };

  const isLoading = isLoadingData || isSaving;

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)]">
        <div className="px-6 py-6">
          <header className="mb-4">
            <h1 className="text-lg font-semibold text-neutral-900">
              1.0 - Pantalla de bienvenida
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure la pantalla inicial que los participantes verán al comenzar la investigación.
            </p>
          </header>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="space-y-0.5">
                <h2 className="text-sm font-medium text-neutral-900">Habilitar pantalla de bienvenida</h2>
                <p className="text-sm text-neutral-500">Mostrar un mensaje de bienvenida a los participantes antes de comenzar la investigación.</p>
              </div>
              <Switch 
                checked={formData.isEnabled}
                onCheckedChange={(checked: boolean) => handleChange('isEnabled', checked)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="title" className="block text-sm font-medium text-neutral-900">
                  Título
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Ingrese un título para su pantalla de bienvenida..."
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    validationErrors.title ? "border-red-500" : "border-neutral-200"
                  )}
                  disabled={isLoading || !formData.isEnabled}
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-neutral-900">
                  Mensaje
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Escriba un mensaje de bienvenida para sus participantes..."
                  className={cn(
                    "min-h-[100px]",
                    validationErrors.message ? "border-red-500" : ""
                  )}
                  disabled={isLoading || !formData.isEnabled}
                />
                {validationErrors.message && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="buttonText" className="block text-sm font-medium text-neutral-900">
                  Texto del botón de inicio
                </label>
                <input
                  type="text"
                  id="buttonText"
                  value={formData.startButtonText}
                  onChange={(e) => handleChange('startButtonText', e.target.value)}
                  placeholder="ej., 'Iniciar investigación', 'Comenzar', 'Continuar'"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    validationErrors.startButtonText ? "border-red-500" : "border-neutral-200"
                  )}
                  disabled={isLoading || !formData.isEnabled}
                />
                {validationErrors.startButtonText && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.startButtonText}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  El texto que aparecerá en el botón para iniciar la investigación.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between px-6 py-3 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">
            {isLoading ? 'Guardando...' : welcomeScreenId 
              ? 'Se actualizará la configuración existente' 
              : 'Se creará una nueva configuración'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isLoading || !formData.isEnabled}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Vista previa
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
} 