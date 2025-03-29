import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';

interface UploadedFile {
  fileUrl: string;
  key: string;
}

const FileUploadExample: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const handleUploadComplete = (fileData: UploadedFile) => {
    setUploadedFiles(prev => [...prev, fileData]);
  };
  
  const handleUploadError = (error: Error) => {
    console.error('Error al subir archivo:', error);
  };
  
  return (
    <div className="file-upload-example">
      <h1>Ejemplo de Carga de Archivos</h1>
      
      <div className="example-container">
        <h2>Carga de Imágenes</h2>
        <FileUploader
          researchId="ejemplo-investigacion-123"
          folder="images"
          accept="image/*"
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
        
        <h2 className="mt-4">Carga de Documentos</h2>
        <FileUploader
          researchId="ejemplo-investigacion-123"
          folder="documents"
          accept=".pdf,.doc,.docx,.txt"
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </div>
      
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-list">
          <h2>Archivos Subidos</h2>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                  {file.key.split('/').pop()}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <style jsx>{`
        .file-upload-example {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 2rem;
          color: #2c3e50;
        }
        
        h2 {
          color: #34495e;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        
        .example-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .mt-4 {
          margin-top: 2rem;
        }
        
        .uploaded-files-list {
          margin-top: 3rem;
          padding: 1.5rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .uploaded-files-list ul {
          list-style: none;
          padding: 0;
        }
        
        .uploaded-files-list li {
          padding: 0.75rem 0;
          border-bottom: 1px solid #e9ecef;
        }
        
        .uploaded-files-list a {
          color: #3498db;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .uploaded-files-list a:hover {
          color: #2980b9;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default FileUploadExample; 