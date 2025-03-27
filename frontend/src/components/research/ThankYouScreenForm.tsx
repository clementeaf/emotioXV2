'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import API_CONFIG from '@/config/api.config';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { thankYouScreenFixedAPI } from '@/lib/thank-you-screen-api';

import { 
  ThankYouScreenConfig, 
  ThankYouScreenFormData,
  ThankYouScreenResponse,
  DEFAULT_THANK_YOU_SCREEN_CONFIG, 
  DEFAULT_THANK_YOU_SCREEN_VALIDATION 
} from '../../types';

interface ThankYouScreenFormProps {
  className?: string;
  researchId: string;
}

export function ThankYouScreenForm({ className, researchId }: ThankYouScreenFormProps) {
  console.log('[ThankYouScreenForm] Inicializado con researchId:', researchId);
  console.log('[ThankYouScreenForm] Usando la baseURL:', API_CONFIG.baseURL);
  
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ThankYouScreenFormData>({
    isEnabled: DEFAULT_THANK_YOU_SCREEN_CONFIG.isEnabled,
    title: DEFAULT_THANK_YOU_SCREEN_CONFIG.title,
    message: DEFAULT_THANK_YOU_SCREEN_CONFIG.message,
    redirectUrl: DEFAULT_THANK_YOU_SCREEN_CONFIG.redirectUrl || '',
    researchId,
  });
  
  // Guardar el ID si ya existe un thank you screen
  const [thankYouScreenId, setThankYouScreenId] = useState<string | null>(null);
  // Estado para errores de validación
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Función para validar URL
  const isValidUrl = (url: string): boolean => {
    return DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.pattern.test(url);
  };

  // Función para obtener datos existentes usando la nueva API
  const fetchExistingData = async () => {
    console.log('[ThankYouScreenForm] Verificando si existe configuración previa para researchId:', researchId);
    
    try {
      if (!researchId) {
        console.error('[ThankYouScreenForm] Error: No hay researchId');
        toast.error('No se pudo cargar la pantalla de agradecimiento: falta el ID de investigación');
        return null;
      }

      console.log('[ThankYouScreenForm] Buscando datos con researchId:', researchId);
      
      // Usar la nueva API mejorada
      const response = await thankYouScreenFixedAPI.getByResearchId(researchId).send();
      console.log('[ThankYouScreenForm] Respuesta recibida:', response);
      
      return response;
    } catch (error) {
      console.log('[ThankYouScreenForm] Error en fetchExistingData:', error);
      
      // Manejar específicamente errores de autenticación (401)
      if (error instanceof Error && error.message.includes('401')) {
        console.error('[ThankYouScreenForm] Error de autenticación:', error);
        toast.error('Error de autenticación. Por favor, inicie sesión nuevamente.');
        return null;
      }
      
      // Para errores 404, simplemente log (no mostrar error al usuario)
      if (error instanceof Error && error.message.includes('404')) {
        console.log('[ThankYouScreenForm] No se encontró configuración previa - esto es normal para nuevas investigaciones');
        return null;
      }
      
      console.error('[ThankYouScreenForm] Error al cargar la pantalla de agradecimiento:', error);
      toast.error('No se pudo cargar la pantalla de agradecimiento. Por favor, inténtelo de nuevo.');
      return null;
    }
  };

  // Consulta para obtener datos existentes
  const { data: thankYouScreenData, isLoading: isLoadingData } = useQuery({
    queryKey: ['thankYouScreen', researchId],
    queryFn: fetchExistingData,
    enabled: !!researchId && !!token,
    retry: (failureCount, error) => {
      // No reintentar si el error es 404
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      // Para otros errores, permitir hasta 2 reintentos
      return failureCount < 2;
    },
    retryDelay: 1000, // Esperar 1 segundo entre reintentos
    staleTime: 60000 // Mantener los datos frescos durante 1 minuto
  });

  // Efecto para actualizar el estado cuando se reciben datos
  useEffect(() => {
    if (thankYouScreenData) {
      console.log('[ThankYouScreenForm] Datos cargados correctamente:', thankYouScreenData);
      setFormData({
        ...formData,
        ...thankYouScreenData,
        researchId,
      });
      setThankYouScreenId(thankYouScreenData.id || null);
    } else {
      console.log('[ThankYouScreenForm] No hay datos previos, usando configuración predeterminada');
      setFormData({
        ...DEFAULT_THANK_YOU_SCREEN_CONFIG,
        researchId,
      });
      setThankYouScreenId(null);
    }
  }, [thankYouScreenData, researchId]);

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
        if (!isValidUrl(formData.redirectUrl)) {
          errors.redirectUrl = 'La URL no tiene un formato válido';
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para guardar usando la nueva API
  const saveThankYouScreen = async (data: ThankYouScreenFormData) => {
    console.log('[ThankYouScreenForm] Guardando datos:', data);
    
    try {
      if (thankYouScreenId) {
        console.log(`[ThankYouScreenForm] Actualizando ThankYouScreen con ID ${thankYouScreenId}`);
        // Usar la nueva API para actualizar
        const response = await thankYouScreenFixedAPI.update(thankYouScreenId, data).send();
        console.log('[ThankYouScreenForm] Respuesta de actualización:', response);
        return response;
      } else {
        console.log('[ThankYouScreenForm] Creando nuevo ThankYouScreen');
        // Usar la nueva API para crear
        const response = await thankYouScreenFixedAPI.create(data).send();
        console.log('[ThankYouScreenForm] Respuesta de creación:', response);
        return response;
      }
    } catch (error) {
      console.error('[ThankYouScreenForm] Error al guardar:', error);
      throw error;
    }
  };

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

  // Mutación para guardar el formulario
  const mutation = useMutation({
    mutationFn: saveThankYouScreen,
    onSuccess: (data: any) => {
      console.log('[ThankYouScreenForm] ThankYouScreen guardada exitosamente', data);
      toast.success('Pantalla de agradecimiento guardada exitosamente');
      
      // Actualizar el ID si es una nueva creación
      if (data && data.id && !thankYouScreenId) {
        setThankYouScreenId(data.id);
      }
      
      // Invalidar la consulta para recargar los datos
      queryClient.invalidateQueries({ queryKey: ['thankYouScreen', researchId] });
    },
    onError: (error: Error) => {
      console.error('[ThankYouScreenForm] Error al guardar ThankYouScreen:', error);
      toast.error(error.message || 'Error al guardar la pantalla de agradecimiento');
    }
  });

  // Guardar datos del formulario
  const handleSave = async () => {
    console.log('[ThankYouScreenForm] Iniciando guardado...');
    
    // Validar formulario
    const errors: Record<string, string> = {};
    
    // Validar researchId
    if (!formData.researchId) {
      errors.researchId = 'El ID de investigación es obligatorio';
      console.error('[ThankYouScreenForm] Error: falta el ID de investigación');
    }
    
    // Validar campos obligatorios si está habilitado
    if (formData.isEnabled) {
      if (!formData.title) {
        errors.title = 'El título es obligatorio';
      }
      if (!formData.message) {
        errors.message = 'El mensaje es obligatorio';
      }
      
      // Validar URL si está presente
      if (formData.redirectUrl && !isValidUrl(formData.redirectUrl)) {
        errors.redirectUrl = 'La URL de redirección no es válida';
      }
    }
    
    // Si hay errores, mostrarlos y detener
    if (Object.keys(errors).length > 0) {
      console.log('[ThankYouScreenForm] Errores de validación:', errors);
      setValidationErrors(errors);
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }
    
    // Limpiar errores previos
    setValidationErrors({});
    
    // Intentar guardar
    console.log('[ThankYouScreenForm] Datos a guardar:', { ...formData, researchId });
    mutation.mutate({ ...formData, researchId });
  };

  // Vista previa del formulario
  const handlePreview = () => {
    // Implementar lógica de vista previa
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario para ver la vista previa');
      return;
    }
    toast.success('Vista previa próximamente!');
  };

  const isLoadingForm = isLoadingData || mutation.isPending;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold">Pantalla de agradecimiento</h2>
          <p className="text-sm text-neutral-500">
            Muestra un mensaje de agradecimiento a los participantes al finalizar la investigación
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-500">
            {formData.isEnabled ? 'Habilitado' : 'Deshabilitado'}
          </span>
          <Switch
            checked={formData.isEnabled}
            onCheckedChange={(checked: boolean) => handleChange('isEnabled', checked)}
            disabled={isLoadingForm}
          />
        </div>
      </div>

      {formData.isEnabled && (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-neutral-100">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={cn(
                "w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500",
                validationErrors.title ? 'border-red-500' : 'border-neutral-200'
              )}
              disabled={isLoadingForm || !formData.isEnabled}
            />
            {validationErrors.title && (
              <p className="text-xs text-red-500">{validationErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Mensaje <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={4}
              className={cn(
                "w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500",
                validationErrors.message ? 'border-red-500' : ''
              )}
              disabled={isLoadingForm || !formData.isEnabled}
            />
            {validationErrors.message && (
              <p className="text-xs text-red-500">{validationErrors.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="redirectUrl" className="text-sm font-medium">
              URL de redirección <span className="text-neutral-500">(opcional)</span>
            </label>
            <input
              id="redirectUrl"
              value={formData.redirectUrl}
              onChange={(e) => handleChange('redirectUrl', e.target.value)}
              placeholder="https://ejemplo.com"
              className={cn(
                "w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500",
                validationErrors.redirectUrl ? 'border-red-500' : 'border-neutral-200'
              )}
              disabled={isLoadingForm || !formData.isEnabled}
            />
            {validationErrors.redirectUrl && (
              <p className="text-xs text-red-500">{validationErrors.redirectUrl}</p>
            )}
            <p className="text-xs text-neutral-500">
              Si se proporciona, los participantes serán redirigidos a esta URL después de mostrar la pantalla de agradecimiento
            </p>
          </div>
        </div>
      )}

      <footer className="flex items-center justify-between px-8 py-4 mt-6 bg-neutral-50 rounded-lg border border-neutral-100">
        <p className="text-sm text-neutral-500">
          {isLoadingForm ? 'Guardando...' : thankYouScreenId 
            ? 'Se actualizará la configuración existente' 
            : 'Se creará una nueva configuración'}
        </p>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isLoadingForm || !formData.isEnabled}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Vista previa
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoadingForm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoadingForm ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </footer>
    </div>
  );
} 