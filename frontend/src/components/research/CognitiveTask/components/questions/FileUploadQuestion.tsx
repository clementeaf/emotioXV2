import React, { useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Upload, Trash2 } from 'lucide-react';
import { FileUploadQuestionProps } from '../../types';
import { Switch } from '@/components/ui/Switch';

/**
 * Componente que maneja la configuración de preguntas con carga de archivos
 */
export const FileUploadQuestion: React.FC<FileUploadQuestionProps> = ({
  question,
  onQuestionChange,
  onFileUpload,
  onFileDelete,
  disabled,
  isUploading,
  uploadProgress
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onFileUpload) {
      onFileUpload(e.target.files);
      // Reset the file input
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Añadir pregunta"
          value={question.title}
          onChange={(e) => onQuestionChange({ title: e.target.value })}
          className="flex-1"
          disabled={disabled}
        />
        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Mostrar condicionalmente</span>
            <Switch
              checked={question.showConditionally}
              onCheckedChange={(checked: boolean) => onQuestionChange({ showConditionally: checked })}
              disabled={disabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Obligatorio</span>
            <Switch
              checked={question.required}
              onCheckedChange={(checked: boolean) => onQuestionChange({ required: checked })}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-2 border-dashed rounded-lg bg-neutral-50 flex flex-col items-center justify-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
          accept="image/*,.pdf"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-sm text-neutral-600">Subiendo archivo...</p>
            <div className="w-full bg-neutral-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-neutral-500">{uploadProgress || 0}% completado</p>
          </div>
        ) : question.files && question.files.length > 0 ? (
          <div className="w-full space-y-3">
            {question.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-white border rounded">
                <div className="flex items-center gap-2">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={file.url} 
                      alt={file.name} 
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded">
                      <span className="text-xs text-blue-700">{file.type.split('/')[1]}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-neutral-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onFileDelete && onFileDelete(file.id)}
                  className="text-red-500 hover:text-red-700"
                  disabled={disabled}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              className="w-full mt-3"
              disabled={disabled || isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir otro archivo
            </Button>
          </div>
        ) : (
          <>
            <Upload size={24} className="text-neutral-400" />
            <p className="text-sm text-neutral-600">Arrastra un archivo o</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={disabled || isUploading}
            >
              Seleccionar archivo
            </Button>
            <p className="text-xs text-neutral-500">Resolución recomendada: 1000x1000px</p>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Marco de Dispositivo</span>
          <Switch
            checked={question.deviceFrame || false}
            onCheckedChange={(checked: boolean) => onQuestionChange({ deviceFrame: checked })}
            disabled={disabled}
          />
        </div>
        <span className="text-xs text-neutral-500">
          {question.deviceFrame ? 'Con Marco' : 'Sin Marco'}
        </span>
      </div>
    </div>
  );
}; 