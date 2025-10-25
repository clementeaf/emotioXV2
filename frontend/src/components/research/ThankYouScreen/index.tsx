import React from 'react';
import { ScreenFormWrapper } from '@/components/common/ScreenFormWrapper';

interface ThankYouScreenFormProps {
  className?: string;
  researchId: string;
  onSave?: () => void;
}

export const ThankYouScreenForm: React.FC<ThankYouScreenFormProps> = ({
  researchId,
  onSave
}) => {
  return (
    <ScreenFormWrapper
      screenType="thankyou"
      researchId={researchId}
      onSave={onSave}
    />
  );
};
