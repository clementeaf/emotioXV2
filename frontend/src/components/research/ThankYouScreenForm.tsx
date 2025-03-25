'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThankYouScreenConfig, DEFAULT_THANK_YOU_SCREEN_CONFIG, DEFAULT_THANK_YOU_SCREEN_VALIDATION } from '@/shared/interfaces/thank-you-screen.interface';
import { alovaInstance } from '@/config/alova.config';
import API_CONFIG from '@/config/api.config';

// Definir el tipo para la API
const thankYouScreenAPI = {
  getByResearchId: (researchId: string) => 
    alovaInstance.Get(`/api/thank-you-screens/research/${researchId}`),
  
  getById: (id: string) => 
    alovaInstance.Get(`/api/thank-you-screens/${id}`),
  
  create: (data: any) => 
    alovaInstance.Post(`/api/thank-you-screens`, data),
  
  update: (id: string, data: any) => 
    alovaInstance.Put(`/api/thank-you-screens/${id}`, data),
  
  delete: (id: string) => 
    alovaInstance.Delete(`/api/thank-you-screens/${id}`),
};

// Tipo para la respuesta de la API
interface ThankYouScreenResponse {
  data?: ThankYouScreenConfig;
  id?: string;
  error?: string;
  success?: boolean;
}

interface ThankYouScreenFormProps {
  className?: string;
  researchId: string;
}

export function ThankYouScreenForm({ className, researchId }: ThankYouScreenFormProps) {
  console.log('DEBUG: ThankYouScreenForm inicializado con researchId:', researchId);
  console.log('DEBUG: Usando la baseURL:', API_CONFIG.baseURL);
  console.log('DEBUG: URL para get by research:', `${API_CONFIG.baseURL}/api/thank-you-screens/research/${researchId}`);
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ThankYouScreenConfig>({
    isEnabled: DEFAULT_THANK_YOU_SCREEN_CONFIG.isEnabled,
    title: DEFAULT_THANK_YOU_SCREEN_CONFIG.title,
    message: DEFAULT_THANK_YOU_SCREEN_CONFIG.message,
    redirectUrl: DEFAULT_THANK_YOU_SCREEN_CONFIG.redirectUrl || ""
  });
  // Guardar el ID si ya existe un thank you screen
  const [thankYouScreenId, setThankYouScreenId] = useState<string | null>(null);
  // Estado para errores de validación
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Consultar datos de thank you screen existentes
  const { isLoading: isLoadingData, data: thankYouScreenData } = useQuery({
    queryKey: ['thankYouScreen', researchId] as const,
    queryFn: async () => {
      console.log('DEBUG: Ejecutando consulta para obtener thank you screen con researchId:', researchId);
      try {
        const response = await thankYouScreenAPI.getByResearchId(researchId).send();
        console.log('DEBUG: Respuesta de consulta thank you screen:', response);
        return response as ThankYouScreenResponse;
      } catch (error) {
        console.error('DEBUG: Error al consultar thank you screen:', error);
        throw error;
      }
    },
    enabled: !!researchId && !!token
  });

  // Actualizar el formulario cuando se reciben datos
  useEffect(() => {
    console.log('DEBUG: useEffect thankYouScreenData cambió:', thankYouScreenData);
    if (thankYouScreenData?.data) {
      console.log('DEBUG: Actualizando formulario con datos existentes:', thankYouScreenData.data);
      // Si tenemos un ID en la respuesta, guardarlo
      if (thankYouScreenData.id) {
        setThankYouScreenId(thankYouScreenData.id);
        console.log('DEBUG: Thank you screen ID guardado:', thankYouScreenData.id);
      }
      setFormData({
        isEnabled: thankYouScreenData.data.isEnabled,
        title: thankYouScreenData.data.title,
        message: thankYouScreenData.data.message,
        redirectUrl: thankYouScreenData.data.redirectUrl || ""
      });
      console.log('Thank you screen data loaded successfully');
    } else if (thankYouScreenData) {
      console.log('DEBUG: No se encontraron datos de thank you screen, usando valores por defecto');
      setThankYouScreenId(null);
      console.log('No thank you screen configuration found. Using defaults.');
    }
  }, [thankYouScreenData]);

  // Validar el formulario
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Solo validar si está habilitado
    if (formData.isEnabled) {
      // Validar título
      if (!formData.title.trim()) {
        errors.title = 'El título es obligatorio';
      } else if (formData.title.length < DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.minLength) {
        errors.title = `El título debe tener al menos ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.minLength} caracteres`;
      } else if (formData.title.length > DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.maxLength) {
        errors.title = `El título no puede exceder ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.maxLength} caracteres`;
      }
      
      // Validar mensaje
      if (!formData.message.trim()) {
        errors.message = 'El mensaje es obligatorio';
      } else if (formData.message.length < DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.minLength) {
        errors.message = `El mensaje debe tener al menos ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.minLength} caracteres`;
      } else if (formData.message.length > DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.maxLength) {
        errors.message = `El mensaje no puede exceder ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.maxLength} caracteres`;
      }
      
      // Validar URL (solo si se proporciona)
      if (formData.redirectUrl && formData.redirectUrl.trim() !== '') {
        if (!DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.pattern.test(formData.redirectUrl)) {
          errors.redirectUrl = 'La URL no tiene un formato válido';
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Mutación para guardar el formulario
  const { mutate: saveThankYouScreen, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      console.log('DEBUG: Guardando thank you screen con datos:', data);
      try {
        let response;
        let fullUrl = '';
        
        // Si tenemos un ID, actualizar el registro existente
        if (thankYouScreenId) {
          console.log(`DEBUG: Actualizando thank you screen con ID ${thankYouScreenId}`);
          fullUrl = `/api/thank-you-screens/${thankYouScreenId}`;
          console.log('DEBUG: URL completa para actualización:', fullUrl);
          response = await thankYouScreenAPI.update(thankYouScreenId, data).send();
        } else {
          // Si no tenemos ID, crear un nuevo registro
          fullUrl = `/api/thank-you-screens`;
          console.log('DEBUG: URL completa para creación:', fullUrl);
          console.log('DEBUG: Creando nuevo thank you screen');
          response = await thankYouScreenAPI.create(data).send();
        }
        
        console.log('DEBUG: Respuesta al guardar thank you screen:', response);
        
        // Convertir la respuesta a ThankYouScreenResponse
        const typedResponse = response as ThankYouScreenResponse;
        
        // Si la respuesta incluye un ID y no teníamos uno, guardarlo
        if (typedResponse && typedResponse.id && !thankYouScreenId) {
          setThankYouScreenId(typedResponse.id);
          console.log('DEBUG: Nuevo thank you screen ID guardado:', typedResponse.id);
        }
        
        return typedResponse;
      } catch (error) {
        console.error('DEBUG: Error al guardar thank you screen:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('DEBUG: Thank you screen guardada exitosamente', data);
      toast.success('Pantalla de agradecimiento guardada exitosamente');
      // Invalidar la consulta para recargar los datos
      queryClient.invalidateQueries({ queryKey: ['thankYouScreen', researchId] });
    },
    onError: (error: Error) => {
      console.error('DEBUG: Error al guardar thank you screen:', error);
      toast.error(error.message || 'Error al guardar la pantalla de agradecimiento');
    }
  });

  // Manejar cambios en el formulario
  const handleChange = (field: keyof ThankYouScreenConfig, value: any) => {
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
    
    saveThankYouScreen(requestData);
  };

  // Vista previa del formulario
  const handlePreview = () => {
    // Implementar lógica de vista previa
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario para ver la vista previa');
      return;
    }
    toast.success('Vista previa próximamente!');
    // Aquí podríamos abrir un modal o una nueva ventana con la vista previa
  };

  const isLoading = isLoadingData || isSaving;

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900">
              4.0 - Thank you screen
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure the final screen that participants will see after completing the research.
            </p>
          </header>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="space-y-0.5">
                <h2 className="text-sm font-medium text-neutral-900">Enable Thank You Screen</h2>
                <p className="text-sm text-neutral-500">Show a thank you message to participants after completing the research.</p>
              </div>
              <Switch 
                checked={formData.isEnabled}
                onCheckedChange={(checked: boolean) => handleChange('isEnabled', checked)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-neutral-900">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter a title for your thank you screen..."
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

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-neutral-900">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Write a thank you message for your participants..."
                  className={cn(
                    "min-h-[120px]",
                    validationErrors.message ? "border-red-500" : ""
                  )}
                  disabled={isLoading || !formData.isEnabled}
                />
                {validationErrors.message && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="redirectUrl" className="block text-sm font-medium text-neutral-900">
                  Redirect URL (Optional)
                </label>
                <input
                  type="url"
                  id="redirectUrl"
                  value={formData.redirectUrl}
                  onChange={(e) => handleChange('redirectUrl', e.target.value)}
                  placeholder="https://..."
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    validationErrors.redirectUrl ? "border-red-500" : "border-neutral-200"
                  )}
                  disabled={isLoading || !formData.isEnabled}
                />
                {validationErrors.redirectUrl && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.redirectUrl}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  Participants will be redirected to this URL after completing the research.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">
            {isLoading ? 'Guardando...' : thankYouScreenId 
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
              Preview
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