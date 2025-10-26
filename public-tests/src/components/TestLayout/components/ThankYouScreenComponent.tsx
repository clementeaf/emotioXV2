import React from 'react';
import { useTestStore } from '../../../stores/useTestStore';
import { ThankYouScreenProps } from './ThankYouScreenTypes';
// import { useThankYouScreen } from './useThankYouScreen'; // Removed
import { DisqualifiedScreen } from './DisqualifiedScreen';
import { OverQuotaScreen } from './OverQuotaScreen';
import { SuccessScreen } from './SuccessScreen';

export const ThankYouScreenComponent: React.FC<ThankYouScreenProps> = ({ 
  contentConfiguration, 
  currentQuestionKey, 
  quotaResult, 
  eyeTrackingConfig 
}) => {
  const { researchId, participantId } = useTestStore();
  
  // TODO: Implementar useThankYouScreen o usar alternativa
  // Temporal: lógica básica hasta implementar hook
  console.log('ThankYouScreen - currentQuestionKey:', currentQuestionKey);
  console.log('ThankYouScreen - researchId:', researchId);
  console.log('ThankYouScreen - participantId:', participantId);

  const isDisqualified = eyeTrackingConfig?.backlinks?.disqualified &&
    window.location.search.includes('disqualified=true');

  const isOverQuota = window.location.search.includes('overquota=true');

  if (isDisqualified && eyeTrackingConfig?.backlinks?.disqualified) {
    return <DisqualifiedScreen eyeTrackingConfig={eyeTrackingConfig} />;
  }

  if (isOverQuota && eyeTrackingConfig?.backlinks?.overquota && quotaResult) {
    return <OverQuotaScreen quotaResult={quotaResult} eyeTrackingConfig={eyeTrackingConfig} />;
  }

  return <SuccessScreen contentConfiguration={contentConfiguration} />;
};
