/**
 * Componente de prueba para AlovaJS - TEMPORALMENTE DESHABILITADO
 * Solo para verificar conectividad sin afectar producción
 * 
 * NOTA: Deshabilitado temporalmente debido a problemas de configuración de tipos
 */

import React from 'react';

interface TestAlovaProps {
  researchId: string;
}

export const TestAlova: React.FC<TestAlovaProps> = ({ researchId }) => {
  // Componente INVISIBLE - no afecta UI (temporalmente deshabilitado)
  return (
    <div style={{ display: 'none' }} data-testid="alova-test">
      {/* AlovaJS temporalmente deshabilitado */}
      <pre>AlovaJS temporalmente deshabilitado - researchId: {researchId}</pre>
    </div>
  );
};