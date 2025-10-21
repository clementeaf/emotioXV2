import { GroupedResponsesPageContent } from '@/components/research/responses/GroupedResponsesPage';

interface ResearchPageProps {
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
 * Página principal de investigación
 * Muestra el dashboard con respuestas agrupadas por pregunta
 */
export default async function ResearchPage({ params }: ResearchPageProps) {
  const { id: researchId } = await params;

  return <GroupedResponsesPageContent researchId={researchId} />;
}
