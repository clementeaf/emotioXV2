/**
 * Imports centralizados y optimizados para common components
 * Evita duplicación y mejora la mantenibilidad
 */

// React imports
export { default as React, useState, useEffect, useCallback, useMemo, useRef, memo, createContext, useContext } from 'react';

// Next.js imports
export { useRouter, useSearchParams, useParams } from 'next/navigation';

// UI Components
export { Button } from '@/components/ui/Button';
export { Input } from '@/components/ui/Input';
export { Textarea } from '@/components/ui/Textarea';
export { Switch } from '@/components/ui/Switch';
export { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
export { Checkbox } from '@/components/ui/Checkbox';
export { Label } from '@/components/ui/Label';

// Utils
export { cn } from '@/lib/utils';
export { toastHelpers } from '@/utils/toast';

// API
export { apiClient } from '@/api/config/axios';

// Hooks
export { useAuth } from '@/providers/AuthProvider';
export { useFormManager, useModalManager } from './hooks';

// Types
export type { ErrorModalData, ValidationErrors } from './hooks/useFormManager';
export type { UseModalManagerResult } from './hooks/useModalManager';
