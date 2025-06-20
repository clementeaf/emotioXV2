import { HitZoneEditor } from '@/components/research/CognitiveTask/components/HitZoneEditor';
import React from 'react';
import { HitZone, UploadedFile } from 'shared/interfaces/cognitive-task.interface';

interface HitZonePreviewProps {
  file: UploadedFile;
  hitzones: HitZone[];
}

export const HitZonePreview: React.FC<HitZonePreviewProps> = ({ file, hitzones }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src={file.url}
        alt={`Vista previa de ${file.name}`}
        className="max-w-full max-h-full object-contain"
      />
      <div className="absolute top-0 left-0 w-full h-full">
        <HitZoneEditor
          file={file}
          hitzones={hitzones}
          onHitzonesChange={() => {}} // No se necesita en modo solo lectura
          readOnly={true} // El prop clave para modo de solo lectura
        />
      </div>
    </div>
  );
};
