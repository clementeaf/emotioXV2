import React, { useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { FileUploadQuestionProps } from '../../types';
import { UI_TEXTS } from '../../constants';

/**
 * Componente que maneja la configuración de preguntas de carga de archivos
 */
export const FileUploadQuestion: React.FC<FileUploadQuestionProps> = ({
  question,
  onQuestionChange,
  onFileUpload,
  validationErrors,
  disabled
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const error = validationErrors?.find(
    (error) => error.id === question.id && error.field === 'text'
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload?.(Array.from(e.target.files));
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.FILE_QUESTION?.QUESTION_TEXT_LABEL || 'Texto de la pregunta'}
        </label>
        <Input
          value={question.text || ''}
          onChange={(e) => onQuestionChange({ text: e.target.value })}
          placeholder={UI_TEXTS.FILE_QUESTION?.QUESTION_TEXT_PLACEHOLDER || 'Introduce el texto de la pregunta'}
          disabled={disabled}
          error={error?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.FILE_QUESTION?.DESCRIPTION_LABEL || 'Descripción'}
        </label>
        <Textarea
          value={question.description || ''}
          onChange={(e) => onQuestionChange({ description: e.target.value })}
          placeholder={UI_TEXTS.FILE_QUESTION?.DESCRIPTION_PLACEHOLDER || 'Introduce una descripción opcional'}
          rows={3}
          disabled={disabled}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.FILE_QUESTION?.FILES_LABEL || 'Archivos'}
        </label>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept={question.type === 'navigation_flow' ? 'image/*' : '.pdf,.jpg,.jpeg,.png'}
          multiple={question.type === 'preference_test'}
          disabled={disabled}
        />
        
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileUpload}
            disabled={disabled}
            className="mb-2"
          >
            {question.type === 'navigation_flow' 
              ? (UI_TEXTS.FILE_QUESTION?.UPLOAD_NAVIGATION_FLOW || 'Subir flujo de navegación')
              : (UI_TEXTS.FILE_QUESTION?.UPLOAD_PREFERENCE_TEST || 'Subir test de preferencia')}
          </Button>
          
          {question.fileUrls?.length > 0 && (
            <span className="text-sm text-neutral-500">
              {question.fileUrls.length} {UI_TEXTS.FILE_QUESTION?.FILES_UPLOADED || 'archivos subidos'}
            </span>
          )}
        </div>
        
        {question.fileUrls && question.fileUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {question.fileUrls.map((url, index) => (
              <div key={index} className="relative bg-neutral-50 border border-neutral-200 rounded-md p-2">
                {url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') ? (
                  <img 
                    src={url} 
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-20 object-contain"
                  />
                ) : (
                  <div className="w-full h-20 flex items-center justify-center bg-neutral-100 text-neutral-500 text-xs">
                    {UI_TEXTS.FILE_QUESTION?.FILE || 'Archivo'} {index + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 