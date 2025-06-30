import { useCallback, useEffect, useState } from 'react';

interface GDPRPreferences {
  rememberDecision: boolean;
  autoAccept: boolean;
  showDetailedInfo: boolean;
  notificationFrequency: 'always' | 'once' | 'never';
  lastUpdated: number;
}

interface UseGDPRPreferencesReturn {
  preferences: GDPRPreferences;
  updatePreferences: (newPreferences: Partial<GDPRPreferences>) => void;
  resetPreferences: () => void;
  shouldShowConsent: (researchId: string) => boolean;
  markAsShown: (researchId: string) => void;
  getStoredConsent: (researchId: string) => 'granted' | 'denied' | null;
}

const GDPR_PREFERENCES_KEY = 'emotio_gdpr_preferences';
const GDPR_CONSENT_HISTORY_KEY = 'emotio_gdpr_consent_history';

const DEFAULT_PREFERENCES: GDPRPreferences = {
  rememberDecision: true,
  autoAccept: false,
  showDetailedInfo: true,
  notificationFrequency: 'once',
  lastUpdated: Date.now(),
};

export const useGDPRPreferences = (): UseGDPRPreferencesReturn => {
  const [preferences, setPreferences] = useState<GDPRPreferences>(DEFAULT_PREFERENCES);

  // Cargar preferencias desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GDPR_PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(prev => ({
          ...DEFAULT_PREFERENCES,
          ...parsed,
          lastUpdated: parsed.lastUpdated || Date.now(),
        }));
      }
    } catch (error) {
      console.warn('Error loading GDPR preferences from localStorage:', error);
    }
  }, []);

  // Guardar preferencias en localStorage
  const savePreferences = useCallback((newPreferences: GDPRPreferences) => {
    try {
      localStorage.setItem(GDPR_PREFERENCES_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Error saving GDPR preferences to localStorage:', error);
    }
  }, []);

  // Actualizar preferencias
  const updatePreferences = useCallback((newPreferences: Partial<GDPRPreferences>) => {
    const updatedPreferences = {
      ...preferences,
      ...newPreferences,
      lastUpdated: Date.now(),
    };

    setPreferences(updatedPreferences);
    savePreferences(updatedPreferences);
  }, [preferences, savePreferences]);

  // Resetear preferencias
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);

    // Limpiar historial de consentimientos
    try {
      localStorage.removeItem(GDPR_CONSENT_HISTORY_KEY);
    } catch (error) {
      console.warn('Error clearing GDPR consent history:', error);
    }
  }, [savePreferences]);

  // Verificar si debe mostrar consentimiento
  const shouldShowConsent = useCallback((researchId: string): boolean => {
    // Si no recordar decisión, siempre mostrar
    if (!preferences.rememberDecision) {
      return true;
    }

    // Si auto-aceptar está habilitado, no mostrar
    if (preferences.autoAccept) {
      return false;
    }

    // Verificar historial de consentimientos
    try {
      const history = localStorage.getItem(GDPR_CONSENT_HISTORY_KEY);
      if (history) {
        const consentHistory = JSON.parse(history);
        const researchConsent = consentHistory[researchId];

        if (researchConsent) {
          // Si ya dio consentimiento y recordar decisión está habilitado
          if (researchConsent.status === 'granted' && preferences.rememberDecision) {
            return false;
          }

          // Si rechazó y la frecuencia es 'never'
          if (researchConsent.status === 'denied' && preferences.notificationFrequency === 'never') {
            return false;
          }

          // Si la frecuencia es 'once' y ya se mostró
          if (preferences.notificationFrequency === 'once' && researchConsent.shown) {
            return false;
          }
        }
      }
    } catch (error) {
      console.warn('Error checking GDPR consent history:', error);
    }

    return true;
  }, [preferences]);

  // Marcar consentimiento como mostrado
  const markAsShown = useCallback((researchId: string) => {
    try {
      const history = localStorage.getItem(GDPR_CONSENT_HISTORY_KEY);
      const consentHistory = history ? JSON.parse(history) : {};

      consentHistory[researchId] = {
        ...consentHistory[researchId],
        shown: true,
        lastShown: Date.now(),
      };

      localStorage.setItem(GDPR_CONSENT_HISTORY_KEY, JSON.stringify(consentHistory));
    } catch (error) {
      console.warn('Error marking GDPR consent as shown:', error);
    }
  }, []);

  // Obtener consentimiento almacenado
  const getStoredConsent = useCallback((researchId: string): 'granted' | 'denied' | null => {
    try {
      const history = localStorage.getItem(GDPR_CONSENT_HISTORY_KEY);
      if (history) {
        const consentHistory = JSON.parse(history);
        const researchConsent = consentHistory[researchId];

        if (researchConsent && preferences.rememberDecision) {
          return researchConsent.status;
        }
      }
    } catch (error) {
      console.warn('Error getting stored GDPR consent:', error);
    }

    return null;
  }, [preferences.rememberDecision]);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    shouldShowConsent,
    markAsShown,
    getStoredConsent,
  };
};
