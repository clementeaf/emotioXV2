import React, { useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreateSection, ErrorSection, StagesSection, SuccessSection } from '../components/research/sections';
import type { SuccessData } from '../types/research-creation.interface';

const NewResearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const step = searchParams.get('step') || 'create';
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  // Función para manejar creación exitosa
  const handleSuccess = useCallback((id: string, name: string) => {
    setSuccessData({ id, name });
    navigate(`/dashboard/new-research?step=success&id=${id}`);
  }, [navigate]);

  // Función para navegar al inicio
  const navigateToStart = useCallback(() => {
    navigate('/dashboard/new-research');
  }, [navigate]);

  // Función para ir al dashboard con la investigación seleccionada
  const handleClose = useCallback(() => {
    if (successData?.id) {
      navigate(`/dashboard?research=${successData.id}`);
    } else if (searchParams.get('id')) {
      navigate(`/dashboard?research=${searchParams.get('id')}`);
    } else {
      navigate('/dashboard');
    }
  }, [navigate, successData, searchParams]);

  // Determinar el contenido basado en el paso actual
  if (step === 'create') {
    return <CreateSection onResearchCreated={handleSuccess} />;
  }

  if (step === 'success' && searchParams.get('id')) {
    const id = searchParams.get('id') || '';
    return (
      <SuccessSection
        id={id}
        name={successData?.name || 'Nueva Investigación'}
        onClose={handleClose}
      />
    );
  }

  if (step === 'stages' && searchParams.get('id')) {
    const id = searchParams.get('id') || '';
    return <StagesSection id={id} />;
  }

  return <ErrorSection onNavigateToStart={navigateToStart} />;
};

export default NewResearchPage;
