import React from 'react';
import { LoadingSpinner, AlertBox, InfoCard, SidebarContainer } from './atomic';

interface EducationalContent {
  title: string;
  generalDescription: string;
  typeExplanation: string;
}

interface EducationalSidebarProps {
  content: EducationalContent | null;
  loading: boolean;
  error: string | null;
  title?: string;
  additionalContent?: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

/**
 * Componente reutilizable para mostrar contenido educativo en la columna lateral
 */
export const EducationalSidebar: React.FC<EducationalSidebarProps> = ({
  content,
  loading,
  error,
  title = "Configuración Avanzada",
  additionalContent,
}) => {
  return (
    <SidebarContainer title={title}>
      {loading && (
        <LoadingSpinner message="Cargando..." />
      )}

      {error && (
        <AlertBox type="error" message={error} />
      )}

      {!loading && !error && content && (
        <InfoCard
          title={content.title}
          description={content.generalDescription}
          details={content.typeExplanation}
        />
      )}

      {!loading && !error && !content && (
        <AlertBox
          type="warning"
          message="No se encontró contenido educativo. Ve a Configuraciones para personalizar esta información."
        />
      )}

      {/* Contenido adicional personalizable */}
      {additionalContent}
    </SidebarContainer>
  );
};

export default EducationalSidebar;
