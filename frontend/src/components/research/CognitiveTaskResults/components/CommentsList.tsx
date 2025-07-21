'use client';

import { BiSelectMultiple } from 'react-icons/bi';

import { cn } from '@/lib/utils';

import { SentimentResult } from '../types';

interface CommentsListProps {
  comments: SentimentResult[];
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll?: () => void;
}

export function CommentsList({
  comments,
  selectedItems,
  onToggleSelection,
  onSelectAll
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

      <div className="divide-y divide-neutral-200">
        {comments.map((item) => {
          // 🎯 EXTRAER EL TEXTO REAL
          const itemText = extractTextValue(item.text);

          return (
            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-neutral-50">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => onToggleSelection(item.id)}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span className="text-sm text-neutral-800">{itemText}</span>
              </div>
              <div>
                <span
                  className={cn(
                    'px-3 py-1 rounded-md text-sm',
                    item.sentiment === 'positive' && 'bg-green-100 text-green-700',
                    item.sentiment === 'neutral' && 'bg-neutral-100 text-neutral-700',
                    item.sentiment === 'negative' && 'bg-red-100 text-red-700',
                    item.sentiment === 'green' && 'bg-green-100 text-green-700',
                  )}
                >
                  {item.sentiment === 'green' ? 'Positive' :
                    item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
