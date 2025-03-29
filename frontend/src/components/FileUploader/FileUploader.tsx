import React, { useState, useRef, ChangeEvent } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import './FileUploader.css';

interface FileUploaderProps {
  researchId: string;
  folder?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // en bytes
  onUploadComplete?: (fileData: { fileUrl: string; key: string }) => void;
  onUploadError?: (error: Error) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  researchId,
  folder = 'general',
  accept = '*/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB por defecto
  onUploadComplete,
  onUploadError
}) => {
  const [dragging, setDragging] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isUploading, 
    progress, 
    error, 
    uploadedUrl, 
    fileKey,
    uploadFile,
    resetState
  } = useFileUpload();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndSetFiles(Array.from(e.target.files));
    }
  };

  const validateAndSetFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errorMessages: string[] = [];
    
    files.forEach(file => {
      // Validar tamaño
      if (file.size > maxSize) {
        errorMessages.push(`El archivo "${file.name}" excede el tamaño máximo permitido`);
        return;
      }
      
      // Validar tipo (solo si accept no es '*/*')
      if (accept !== '*/*') {
        const acceptTypes = accept.split(',').map(type => type.trim());
        const fileType = file.type || '';
        
        const matchesType = acceptTypes.some(type => {
          if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return fileType.startsWith(`${baseType}/`);
          }
          return type === fileType;
        });
        
        if (!matchesType) {
          errorMessages.push(`El archivo "${file.name}" no es un tipo permitido`);
          return;
        }
      }
      
      validFiles.push(file);
    });
    
    setSelectedFiles(validFiles);
    setErrors(errorMessages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setErrors([]);
    resetState();
    
    try {
      // Para simplificar, tomamos solo el primer archivo si no es multiple
      const fileToUpload = selectedFiles[0];
      
      const result = await uploadFile(fileToUpload, researchId, folder);
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
      
      // Limpiar selección después de subir
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido al subir');
      
      if (onUploadError) {
        onUploadError(error);
      }
      
      setErrors(prev => [...prev, error.message]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="file-uploader">
      <div 
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
        />
        
        {selectedFiles.length > 0 ? (
          <div className="selected-files">
            <p>Archivos seleccionados:</p>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="dropzone-placeholder">
            <p>Arrastra y suelta archivos aquí o haz clic para seleccionar</p>
            <small>
              {accept !== '*/*' 
                ? `Tipos aceptados: ${accept}` 
                : 'Todos los tipos de archivo'
              }
            </small>
            <small>Tamaño máximo: {Math.round(maxSize / (1024 * 1024))}MB</small>
          </div>
        )}
      </div>
      
      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error, index) => (
            <p key={index} className="error-message">{error}</p>
          ))}
        </div>
      )}
      
      {isUploading ? (
        <div className="upload-progress">
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      ) : (
        selectedFiles.length > 0 && (
          <button 
            className="upload-button"
            onClick={handleUpload}
            disabled={isUploading}
          >
            Subir archivo
          </button>
        )
      )}
      
      {uploadedUrl && (
        <div className="upload-success">
          <p>¡Archivo subido con éxito!</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 