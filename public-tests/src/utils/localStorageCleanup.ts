/**
 * Utility functions to clean conflicting localStorage entries
 * This prevents localStorage from overriding API responses
 */

export interface CleanupResult {
  removedKeys: string[];
  errors: string[];
}

/**
 * Clean specific response keys that might conflict with API data
 */
export function cleanConflictingResponseKeys(stepIds: string[]): CleanupResult {
  const removedKeys: string[] = [];
  const errors: string[] = [];

  stepIds.forEach(stepId => {
    try {
      const key = `response_${stepId}`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        removedKeys.push(key);
        console.log(`🧹 [LocalStorageCleanup] Removed conflicting key: ${key}`);
      }
    } catch (error) {
      const errorMsg = `Failed to remove localStorage key for stepId ${stepId}: ${error}`;
      errors.push(errorMsg);
      console.error(`❌ [LocalStorageCleanup] ${errorMsg}`);
    }
  });

  return { removedKeys, errors };
}

/**
 * Clean all response-related localStorage entries
 */
export function cleanAllResponseKeys(): CleanupResult {
  const removedKeys: string[] = [];
  const errors: string[] = [];

  try {
    const keysToRemove: string[] = [];
    
    // Collect all response-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('response_') ||
        key === 'participantResponses' ||
        key.startsWith('temp_') ||
        key.startsWith('cognitive_') ||
        key.startsWith('auto_')
      )) {
        keysToRemove.push(key);
      }
    }

    // Remove them
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        removedKeys.push(key);
      } catch (error) {
        errors.push(`Failed to remove ${key}: ${error}`);
      }
    });

    console.log(`🧹 [LocalStorageCleanup] Removed ${removedKeys.length} response keys`);
    
  } catch (error) {
    const errorMsg = `Error during localStorage cleanup: ${error}`;
    errors.push(errorMsg);
    console.error(`❌ [LocalStorageCleanup] ${errorMsg}`);
  }

  return { removedKeys, errors };
}

/**
 * Clean localStorage when API responses are prioritized
 */
export function cleanLocalStorageForAPIResponse(apiResponses: Array<{ id?: string; stepId?: string }>): CleanupResult {
  const stepIds = apiResponses
    .map(response => response.id || response.stepId)
    .filter((id): id is string => Boolean(id));

  console.log(`🧹 [LocalStorageCleanup] Cleaning localStorage for ${stepIds.length} API responses`);
  
  return cleanConflictingResponseKeys(stepIds);
}

/**
 * Emergency cleanup - removes all participant data from localStorage
 * Use only when there are serious conflicts
 */
export function emergencyCleanup(): CleanupResult {
  const removedKeys: string[] = [];
  const errors: string[] = [];

  try {
    const keysToRemove: string[] = [];
    
    // Collect ALL participant-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('participant') ||
        key.includes('response') ||
        key.includes('expandedSteps') ||
        key.includes('progress') ||
        key.includes('maxVisited')
      )) {
        keysToRemove.push(key);
      }
    }

    // Remove them
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        removedKeys.push(key);
      } catch (error) {
        errors.push(`Failed to remove ${key}: ${error}`);
      }
    });

    console.log(`🚨 [LocalStorageCleanup] Emergency cleanup removed ${removedKeys.length} keys`);
    
  } catch (error) {
    const errorMsg = `Error during emergency cleanup: ${error}`;
    errors.push(errorMsg);
    console.error(`❌ [LocalStorageCleanup] ${errorMsg}`);
  }

  return { removedKeys, errors };
} 