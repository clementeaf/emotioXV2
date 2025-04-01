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
import { ThankYouScreenForm as ModularThankYouScreenForm } from './ThankYouScreen';
import { ThankYouScreenFormData } from '@/types';

import { 
  ThankYouScreenConfig, 
  ThankYouScreenResponse,
  DEFAULT_THANK_YOU_SCREEN_CONFIG, 
  DEFAULT_THANK_YOU_SCREEN_VALIDATION 
} from '../../types';

interface ThankYouScreenFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: ThankYouScreenFormData) => void;
}

/**
 * Componente de redirección para mantener compatibilidad con el código existente
 * Este componente simplemente redirige al nuevo componente modular
 */
export function ThankYouScreenForm({ className, researchId, onSave }: ThankYouScreenFormProps) {
  // Usar la versión modular refactorizada
  return (
    <ModularThankYouScreenForm 
      className={className}
      researchId={researchId}
      onSave={onSave}
    />
  );
} 