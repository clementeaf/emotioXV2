import React, { useRef, useState } from 'react';

interface Area {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LocalHitzoneEditorProps {
  imageUrl: string;
  initialAreas?: Area[];
  onSave: (areas: Area[]) => void;
  onClose: () => void;
}

const CANVAS_SIZE = 575;

export const LocalHitzoneEditor: React.FC<LocalHitzoneEditorProps> = ({
  imageUrl,
  initialAreas = [],
  onSave,
  onClose,
}) => {
  const [areas, setAreas] = useState<Area[]>(() => JSON.parse(JSON.stringify(initialAreas)));
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Area | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [testMode, setTestMode] = useState(false);

  // Iniciar dibujo
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStart({ x, y });
    setCurrentRect({ id: `area_${Date.now()}`, x, y, width: 0, height: 0 });
    setDrawing(true);
  };

  // Dibujar rectángulo
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !start) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentRect({
      id: currentRect!.id,
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y),
    });
  };

  // Finalizar dibujo
  const handleMouseUp = () => {
    if (drawing && currentRect && currentRect.width > 10 && currentRect.height > 10) {
      setAreas([...areas, currentRect]);
      setSelectedIdx(areas.length);
    }
    setDrawing(false);
    setStart(null);
    setCurrentRect(null);
  };

  // Seleccionar área
  const handleRectClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIdx(idx);
  };

  // Eliminar área seleccionada
  const handleDelete = () => {
    if (selectedIdx === null) return;
    setAreas(areas.filter((_, idx) => idx !== selectedIdx));
    setSelectedIdx(null);
  };

  return (
    <div style={{ position: 'relative', width: CANVAS_SIZE, height: CANVAS_SIZE, background: '#fff', borderRadius: 8 }}>
      <img
        src={imageUrl}
        alt="Imagen base"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, display: 'block', borderRadius: 8, objectFit: 'contain', background: '#f8fafc' }}
        draggable={false}
      />
      <svg
        ref={svgRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}
        onMouseDown={!testMode ? handleMouseDown : undefined}
        onMouseMove={!testMode ? handleMouseMove : undefined}
        onMouseUp={!testMode ? handleMouseUp : undefined}
      >
        {areas.map((area, idx) => (
          <rect
            key={area.id}
            x={area.x}
            y={area.y}
            width={area.width}
            height={area.height}
            fill={idx === selectedIdx ? 'rgba(0,123,255,0.3)' : 'rgba(0,123,255,0.15)'}
            stroke="#007bff"
            strokeWidth={idx === selectedIdx ? 2 : 1}
            onClick={
              testMode && idx === selectedIdx
                ? () => alert(`¡Hitzone ${area.id} presionado!`)
                : (e) => handleRectClick(idx, e)
            }
            style={{
              cursor: testMode && idx === selectedIdx ? 'pointer' : 'pointer',
              opacity: testMode && idx !== selectedIdx ? 0.5 : 1,
              pointerEvents: testMode && idx !== selectedIdx ? 'none' : 'auto',
            }}
          />
        ))}
        {currentRect && !testMode && (
          <rect
            x={currentRect.x}
            y={currentRect.y}
            width={currentRect.width}
            height={currentRect.height}
            fill={'rgba(0,123,255,0.2)'}
            stroke={'#007bff'}
            strokeDasharray="4"
          />
        )}
      </svg>
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 20, display: 'flex', gap: 8 }}>
        {!testMode && (
          <>
            <button onClick={() => onSave(areas)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar zonas</button>
            {selectedIdx !== null && (
              <>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Eliminar zona</button>
                <button onClick={() => setTestMode(true)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Probar hitzone</button>
              </>
            )}
          </>
        )}
        {testMode && (
          <button onClick={() => setTestMode(false)} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Salir de prueba</button>
        )}
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cerrar</button>
      </div>
    </div>
  );
}; 