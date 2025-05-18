import React, { useRef, useState } from 'react';

interface Area {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SvgHitzoneEditorProps {
  imageUrl: string;
  areas: Area[];
  setAreas: (areas: Area[]) => void;
  selectedAreaIdx: number | null;
  setSelectedAreaIdx: (idx: number | null) => void;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export const SvgHitzoneEditor: React.FC<SvgHitzoneEditorProps> = ({
  imageUrl,
  areas,
  setAreas,
  selectedAreaIdx,
  setSelectedAreaIdx
}) => {
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Area | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Estado para drag y resize
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [resizing, setResizing] = useState<null | { corner: string }> (null);

  // Iniciar dibujo
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // solo click izquierdo
    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setCurrentRect({ id: `area_${Date.now()}`, x, y, width: 0, height: 0 });
    setDrawing(true);
  };

  // Dibujar rectángulo
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !startPoint) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentRect({
      id: currentRect!.id,
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y)
    });
  };

  // Finalizar dibujo
  const handleMouseUp = () => {
    if (drawing && currentRect && currentRect.width > 10 && currentRect.height > 10) {
      setAreas([...areas, currentRect]);
      setSelectedAreaIdx(areas.length);
    }
    setDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  // Seleccionar área
  const handleRectClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAreaIdx(idx);
  };

  // Eliminar área seleccionada
  const handleDelete = () => {
    if (selectedAreaIdx === null) return;
    setAreas(areas.filter((_, idx) => idx !== selectedAreaIdx));
    setSelectedAreaIdx(null);
  };

  // Mover área seleccionada (drag)
  const handleRectDrag = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedAreaIdx !== idx) return;
    // Implementar lógica de drag si se requiere (puede agregarse luego)
  };

  // Iniciar drag
  const handleRectMouseDown = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAreaIdx(idx);
    if (e.shiftKey) return; // Shift para solo seleccionar
    const area = areas[idx];
    setDragOffset({
      x: e.clientX - area.x,
      y: e.clientY - area.y
    });
  };

  // Drag
  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (dragOffset && selectedAreaIdx !== null) {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      setAreas(areas.map((a, idx) => idx === selectedAreaIdx ? { ...a, x, y } : a));
    } else if (resizing && selectedAreaIdx !== null) {
      const rect = svgRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const area = areas[selectedAreaIdx];
      let { x, y, width, height } = area;
      switch (resizing.corner) {
        case 'nw':
          width = width + (x - mouseX);
          height = height + (y - mouseY);
          x = mouseX;
          y = mouseY;
          break;
        case 'ne':
          width = Math.abs(mouseX - x);
          height = height + (y - mouseY);
          y = mouseY;
          break;
        case 'sw':
          width = width + (x - mouseX);
          x = mouseX;
          height = Math.abs(mouseY - y);
          break;
        case 'se':
          width = Math.abs(mouseX - x);
          height = Math.abs(mouseY - y);
          break;
      }
      if (width > 10 && height > 10) {
        setAreas(areas.map((a, idx) => idx === selectedAreaIdx ? { ...a, x, y, width, height } : a));
      }
    }
  };

  // Finalizar drag/resize
  const handleSvgMouseUp = () => {
    setDragOffset(null);
    setResizing(null);
    setDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  // Iniciar resize
  const handleResizeMouseDown = (corner: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing({ corner });
  };

  // Validación de URL
  if (!imageUrl || imageUrl.trim() === '') {
    return <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}>
      <span className="text-neutral-500">No se puede mostrar la imagen. Vuelve a subir el archivo.</span>
    </div>;
  }

  return (
    <div style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
      <img
        src={imageUrl}
        alt="Imagen base"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, display: 'block', borderRadius: 8, objectFit: 'contain', background: '#f8fafc' }}
        draggable={false}
        onError={(e) => {
          e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="%23f8fafc"/><text x="250" y="250" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23999">Error</text></svg>';
        }}
      />
      <svg
        ref={svgRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => { handleMouseMove(e); handleSvgMouseMove(e); }}
        onMouseUp={handleSvgMouseUp}
      >
        {areas.map((area, idx) => (
          <g key={area.id}>
            <rect
              x={area.x}
              y={area.y}
              width={area.width}
              height={area.height}
              fill={idx === selectedAreaIdx ? 'rgba(0,123,255,0.3)' : 'rgba(0,123,255,0.15)'}
              stroke={idx === selectedAreaIdx ? '#007bff' : '#007bff'}
              strokeWidth={idx === selectedAreaIdx ? 2 : 1}
              onClick={(e) => handleRectClick(idx, e)}
              onMouseDown={(e) => idx === selectedAreaIdx ? handleRectMouseDown(idx, e) : undefined}
              style={{ cursor: idx === selectedAreaIdx ? 'move' : 'pointer' }}
            />
            {/* Handles para redimensionar solo si está seleccionada */}
            {idx === selectedAreaIdx && [
              { corner: 'nw', cx: area.x, cy: area.y },
              { corner: 'ne', cx: area.x + area.width, cy: area.y },
              { corner: 'sw', cx: area.x, cy: area.y + area.height },
              { corner: 'se', cx: area.x + area.width, cy: area.y + area.height }
            ].map(h => (
              <circle
                key={h.corner}
                cx={h.cx}
                cy={h.cy}
                r={6}
                fill="#fff"
                stroke="#007bff"
                strokeWidth={2}
                onMouseDown={(e) => handleResizeMouseDown(h.corner, e)}
                style={{ cursor: `${h.corner}-resize` }}
              />
            ))}
          </g>
        ))}
        {currentRect && (
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
      {selectedAreaIdx !== null && (
        <button
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
          onClick={handleDelete}
        >
          Eliminar zona
        </button>
      )}
    </div>
  );
}; 