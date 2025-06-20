import React from 'react';
import { HitZone } from 'shared/interfaces/cognitive-task.interface';

interface HitZoneViewerProps {
  hitzones: HitZone[];
  imageNaturalSize: { width: number; height: number };
  imageRenderedSize: { width: number; height: number };
}

export const HitZoneViewer: React.FC<HitZoneViewerProps> = ({
  hitzones,
  imageNaturalSize,
  imageRenderedSize,
}) => {
  if (!hitzones || hitzones.length === 0 || !imageNaturalSize || !imageRenderedSize) {
    return null;
  }

  const { width: naturalWidth, height: naturalHeight } = imageNaturalSize;
  const { width: renderedWidth, height: renderedHeight } = imageRenderedSize;

  // Calcula el aspect ratio para el escalado (letterboxing/pillarboxing)
  const naturalRatio = naturalWidth / naturalHeight;
  const renderedRatio = renderedWidth / renderedHeight;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (naturalRatio > renderedRatio) {
    // La imagen se ajusta al ancho (pillarboxed)
    scale = renderedWidth / naturalWidth;
    offsetY = (renderedHeight - (naturalHeight * scale)) / 2;
  } else {
    // La imagen se ajusta al alto (letterboxed)
    scale = renderedHeight / naturalHeight;
    offsetX = (renderedWidth - (naturalWidth * scale)) / 2;
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {hitzones.map((zone) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${zone.region.x * scale + offsetX}px`,
          top: `${zone.region.y * scale + offsetY}px`,
          width: `${zone.region.width * scale}px`,
          height: `${zone.region.height * scale}px`,
          backgroundColor: 'rgba(29, 161, 242, 0.2)',
          border: '2px solid rgba(29, 161, 242, 0.7)',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(29, 161, 242, 0.5)',
        };

        return <div key={zone.id} style={style} />;
      })}
    </div>
  );
};
