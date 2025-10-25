import React from 'react';
import { ScreenFormWrapper } from '@/components/common/ScreenFormWrapper';

interface WelcomeScreenFormProps {
  researchId: string;
}

export const WelcomeScreenForm: React.FC<WelcomeScreenFormProps> = ({
  researchId,
}) => {
  return (
    <ScreenFormWrapper
      screenType="welcome"
      researchId={researchId}
    />
  );
};
