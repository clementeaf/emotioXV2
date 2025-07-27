'use client';

import { BiSelectMultiple } from 'react-icons/bi';


import { SentimentResult } from '../types';

interface CommentsListProps {
  comments: SentimentResult[];
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll?: () => void;
  questionId?: string;
  questionType?: string;
  required?: boolean;
  conditionalityDisabled?: boolean;
}

export function CommentsList({
  comments,
  selectedItems,
  onToggleSelection,
  onSelectAll,
  questionId,
  questionType,
  required = false,
  conditionalityDisabled = false
}: CommentsListProps) {
  // 🎯 FUNCIÓN PARA EXTRAER EL TEXTO REAL
  const extractTextValue = (text: any): string => {
    if (typeof text === 'string') {
      return text;
    }

    if (typeof text === 'object' && text !== null) {
      // Intentar extraer el valor de diferentes propiedades comunes
      if (text.value) {
        return String(text.value);
      }
      if (text.text) {
        return String(text.text);
      }
      if (text.response) {
        return String(text.response);
      }
      if (text.answer) {
        return String(text.answer);
      }
      // Si no hay propiedades conocidas, mostrar el objeto como JSON
      return JSON.stringify(text);
    }

    // Fallback para otros tipos
    return String(text);
  };

  return (
    <div className="border-r border-neutral-200 max-h-[500px] overflow-y-auto">
      {/* Fila de columnas de tabla */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex gap-8">
            <span className="text-sm font-medium text-neutral-500">Comment</span>
            <span className="text-sm font-medium text-neutral-500">Mood</span>
          </div>
          <div>
            <button
              className="p-1 rounded-md hover:bg-neutral-200"
              onClick={onSelectAll}
              title="Select All"
            >
              <BiSelectMultiple className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>
      {/* Aquí irían las filas de comentarios si existieran */}
    </div>
  );
}
