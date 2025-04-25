import React from 'react';
import { Button } from '@/components/ui/Button';
import { PlusCircle } from 'lucide-react';

interface AddQuestionButtonProps {
  onClick: () => void;
}

export const AddQuestionButton: React.FC<AddQuestionButtonProps> = ({ onClick }) => {
  return (
    <Button 
      variant="outline" 
      onClick={onClick} 
      className="w-full mt-4 flex items-center justify-center space-x-2"
    >
      <PlusCircle className="h-4 w-4" />
      <span>Añadir Pregunta</span>
    </Button>
  );
}; 