'use client';

import React from 'react';
import { RecruitEyeTrackingForm } from './Recruit/RecruitEyeTrackingForm';

interface EyeTrackingRecruitFormProps {
  researchId: string;
  className?: string;
}

export function EyeTrackingRecruitForm({ researchId, className }: EyeTrackingRecruitFormProps) {
  return (
    <RecruitEyeTrackingForm 
      researchId={researchId}
      className={className}
    />
  );
} 