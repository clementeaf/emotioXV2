import { useRouter } from 'next/navigation';
import React from 'react';

import { Button } from '@/components/ui/Button';

interface ResearchConfirmationProps {
  researchId: string;
  researchName: string;
  onClose?: () => void;
}

export function ResearchConfirmation({ 
  researchId, 
  researchName,
  onClose 
}: ResearchConfirmationProps) {
  const router = useRouter();
  
  const handleGoToDashboard = () => {
    if (onClose) {
      onClose();
    }
    router.push('/dashboard');
  };
  
  const handleGoToResearch = () => {
    if (onClose) {
      onClose();
    }
    router.push(`/dashboard?research=${researchId}`);
  };
  
  const handleGoToAimFramework = () => {
    if (onClose) {
      onClose();
    }
    router.push(`/dashboard?research=${researchId}&aim=true&section=welcome-screen`);
  };

  return (
    <div className="p-6 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <div className="h-8 w-8 text-green-600">✓</div>
      </div>
      <h2 className="text-2xl font-bold mb-1">Research Created!</h2>
      <p className="text-neutral-500 mb-6">
        Your research "{researchName}" has been created successfully.
      </p>
      
      <div className="space-y-3 w-full">
        <Button 
          onClick={handleGoToResearch}
          className="w-full"
        >
          Continue to Research
        </Button>
        
        <Button 
          onClick={handleGoToAimFramework}
          variant="outline"
          className="w-full"
        >
          Go to AIM Framework
        </Button>
        
        <Button 
          onClick={handleGoToDashboard}
          variant="ghost"
          className="w-full"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
} 