import { GroupedResponsesPageContent } from '../../../../../components/research/GroupedResponsesPage';

interface GroupedResponsesPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página para visualizar respuestas agrupadas por pregunta
 * Esta estructura es más eficiente para análisis estadísticos
 */
export default async function GroupedResponsesPage({ params }: GroupedResponsesPageProps) {
  const { id: researchId } = await params;

  return <GroupedResponsesPageContent researchId={researchId} />;
}
