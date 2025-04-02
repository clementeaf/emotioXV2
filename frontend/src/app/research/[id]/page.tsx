import ResearchClient from './client';

interface PageProps {
  params: {
    id: string;
  };
}

// Requerido para la exportación estática con output: export
export function generateStaticParams() {
  // Proporcionamos IDs específicos para pre-renderizar
  return [
    { id: 'demo' },
    { id: 'test' },
    { id: 'example' }
  ];
}

export default function ResearchPage({ params }: PageProps) {
  return <ResearchClient id={params.id} />;
} 