/**
 * Imports centralizados y optimizados para research components
 * Evita duplicación y mejora la mantenibilidad
 */

// React imports
export { default as React, useState, useEffect, useCallback, useMemo, useRef, memo, createContext, useContext } from 'react';

// Next.js imports
export { useRouter, useSearchParams, useParams } from 'next/navigation';

// Utils
export { cn } from '@/lib/utils';

// Hooks
export { useAuth } from '@/providers/AuthProvider';
export { useEducationalContent } from '@/hooks/useEducationalContent';
export { useGlobalResearchData } from '@/hooks/useGlobalResearchData';
export { useCompanies } from '@/hooks/useCompanies';

// Common components
export * from '@/components/common';

// API
export { apiClient } from '@/api/config/axios';

// Config
export { STAGE_TITLES, STAGE_COMPONENTS, DEFAULT_SECTION } from '@/config/research-stages.config';
