'use client';

import { SmartVOCForm as ModularSmartVOCForm } from './SmartVOC';

interface SmartVOCFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: any) => void;
}

export function SmartVOCForm(props: SmartVOCFormProps) {
  return <ModularSmartVOCForm {...props} />;
} 