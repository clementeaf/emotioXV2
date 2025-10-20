/**
 * Techniques registry configuration
 */

export const getTechniqueStages = (technique: string): string[] => {
  const techniqueStages: Record<string, string[]> = {
    'aim-framework': ['welcome-screen', 'screener', 'implicit-association', 'smart-voc', 'thank-you'],
    'biometric-cognitive': ['welcome-screen', 'screener', 'cognitive-task', 'eye-tracking', 'thank-you']
  };

  return techniqueStages[technique] || ['welcome-screen'];
};
