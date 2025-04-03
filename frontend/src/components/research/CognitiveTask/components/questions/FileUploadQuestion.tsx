import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { FileUploadQuestionProps } from '../../types';
import { UI_TEXTS } from '../../constants';

// Interfaz para archivos con soporte de tiempo y edición
interface FileWithTime {
  id: string;
  name: string;
  time: number; // en segundos
  editingHitzones: boolean;
}

// Interfaz para los errores de validación
interface ValidationError {
  id: string;
  field: string;
  message: string;
}

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
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithTime[]>([]);
  
  // Buscar error de validación específico para esta pregunta
  const errorFound = validationErrors && 
    Array.isArray(validationErrors) ? 
    validationErrors.find((err: ValidationError) => 
      err.id === question.id && err.field === 'text'
    ) : null;

  // Asegurarnos de que la propiedad files esté inicializada
  React.useEffect(() => {
    if (question.files && question.files.length > 0 && files.length === 0) {
      // Convertir los archivos existentes al formato con tiempo
      const filesWithTime = question.files.map(file => ({
        id: file.id,
        name: file.name,
        time: 0, // Tiempo por defecto
        editingHitzones: false
      }));
      setFiles(filesWithTime);
    }
  }, [question.files]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    onFileUpload?.(fileList);
    
    // Actualizar el estado local con los nuevos archivos
    const newFiles = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      time: 0, // Tiempo inicial
      editingHitzones: false
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTimeChange = (id: string, time: number) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, time } : file
    ));
  };

  const toggleHitzoneEditing = (id: string) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, editingHitzones: !file.editingHitzones } : file
    ));
  };

  const handlePreview = (file: FileWithTime) => {
    // Implementar vista previa de archivo
    console.log("Preview file:", file);
    // Para una implementación real, podría abrir un modal con la imagen o mostrarla en una nueva pestaña
  };

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
    // También actualizar el estado global
    if (question.files) {
      const updatedFiles = question.files.filter(file => file.id !== id);
      onQuestionChange({ files: updatedFiles });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Texto de la pregunta
        </label>
        <Input
          value={question.title || ''}
          onChange={(e) => onQuestionChange({ title: e.target.value })}
          placeholder="Introduce el texto de la pregunta"
          disabled={disabled}
          error={errorFound?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Descripción
        </label>
        <Textarea
          value={question.description || ''}
          onChange={(e) => onQuestionChange({ description: e.target.value })}
          placeholder="Introduce una descripción opcional"
          rows={3}
          disabled={disabled}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {question.type === 'navigation_flow' ? 'Files to test' : 'Files to test'}
        </label>
        <p className="text-sm text-neutral-500 mb-2">
          Please, upload the image or video to be tested with eye tracking.
        </p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*"
          multiple={question.type === 'preference_test'}
          disabled={disabled}
        />
        
        {/* Área de drag & drop */}
        <div 
          className={`border-2 border-dashed rounded-lg p-6 mb-4 flex flex-col items-center justify-center min-h-[160px] 
            ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-neutral-300'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileUpload}
        >
          <div className="text-blue-600 mb-3">
            <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 18V8.5C20 8.22386 19.7761 8 19.5 8H13.5C13.2239 8 13 7.77614 13 7.5V4.5C13 4.22386 12.7761 4 12.5 4H4.5C4.22386 4 4 4.22386 4 4.5V18.5C4 18.7761 4.22386 19 4.5 19H19.5C19.7761 19 20 18.7761 20 18.5V18Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="text-sm text-center text-neutral-700 font-medium">
            Click or drag file to this area to upload
          </p>
          <p className="text-xs text-center text-neutral-500 mt-1">
            Support for a single or bulk upload.<br />
            JPG, JPEG, PNG or GIF supported<br />
            Max image dimensions are 16000x16000.<br />
            Max file size is 5MB
          </p>
          
          {/* Lista de archivos seleccionados */}
          {files.map(file => (
            <div key={file.id} className="text-xs text-neutral-500 mt-1">
              {file.name}
            </div>
          ))}
        </div>
        
        {/* Tabla de archivos subidos */}
        {files.length > 0 && (
          <div className="overflow-hidden border border-neutral-200 rounded-md mt-4">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 mr-3 bg-neutral-100 rounded-md flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 8L15 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V8Z" stroke="#4B5563" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-neutral-900">{file.name}</p>
                        <p className="text-xs text-neutral-500">Edit hitzones</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      <span className="bg-neutral-100 py-1 px-2 rounded">
                        {file.time} Segs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handlePreview(file)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-900 mx-3"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleHitzoneEditing(file.id)}
                        className="text-blue-600 hover:text-blue-900 ml-3"
                      >
                        {file.editingHitzones ? 'Save' : 'Edit hitzones'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}; 