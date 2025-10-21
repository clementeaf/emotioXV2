import { GroupedResponsesPageContent } from '../../../../../components/research/responses/GroupedResponsesPage';

interface GroupedResponsesPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Para soporte de export estático
export async function generateStaticParams() {
  // Generar parámetros estáticos para rutas conocidas
  return [
    { id: 'demo' },
    { id: 'test' },
    { id: 'example' }
  ];
}

/**
 * Página para visualizar respuestas agrupadas por pregunta
 * Esta estructura es más eficiente para análisis estadísticos
 */
export default async function GroupedResponsesPage({ params }: GroupedResponsesPageProps) {
  const { id: researchId } = await params;

  return <GroupedResponsesPageContent researchId={researchId} />;
}
