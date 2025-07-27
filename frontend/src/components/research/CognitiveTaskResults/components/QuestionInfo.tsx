'use client';

import { FiFilter } from 'react-icons/fi';

interface QuestionInfoProps {
  questionId: string;
  questionType: string;
  conditionalityDisabled: boolean;
  required: boolean;
  hasNewData?: boolean;
  onFilter?: () => void;
  onUpdate?: () => void;
}

export function QuestionInfo({
  questionId,
  questionType,
  conditionalityDisabled,
  required,
  hasNewData = false,
  onFilter,
  onUpdate
}: QuestionInfoProps) {
  return (
    <div className="p-5 border-b border-neutral-200">
      <div className="flex items-center flex-wrap gap-4">
        <span className="font-medium text-neutral-800 mr-2">3.1.- Question</span>
        <div className="flex items-center gap-2 ml-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">Short Text question</span>
          {conditionalityDisabled && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">Conditionally disabled</span>
          )}
          {required && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium">Required</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onFilter && (
            <button
              className="p-2 text-neutral-500 hover:text-neutral-700"
              onClick={onFilter}
            >
              <FiFilter className="w-5 h-5" />
            </button>
          )}
          {hasNewData && (
            <div className="flex items-center bg-blue-50 rounded-lg overflow-hidden">
              <div className="px-3 py-2 text-blue-800 font-medium">
                New data was obtained
              </div>
              {onUpdate && (
                <button
                  className="px-4 py-2 bg-blue-700 text-white font-medium"
                  onClick={onUpdate}
                >
                  Update
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
