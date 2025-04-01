import dynamic from 'next/dynamic';

// Cargar ResearchStageManager dinámicamente con el tipo correcto
const ResearchStageManager = dynamic(
  () => import('@/components/research/ResearchStageManager').then(mod => mod.ResearchStageManager),
  { ssr: false }
) as any; // Usamos any para evitar problemas de tipos en este contexto

interface PageProps {
  params: {
    id: string;
  };
}

// Requerido para exportación estática con parámetros dinámicos
export async function generateStaticParams() {
  // Proporcionamos una lista de parámetros para pre-renderizar en build time
  // Puedes hacer esto dinámico basado en API o datos existentes
  // Para este ejemplo, usamos algunos IDs de ejemplo
  return [
    { id: 'demo' },
    { id: 'test' },
    { id: 'example' }
  ];
}

export default function ResearchPage({ params }: PageProps) {
  return <ResearchStageManager researchId={params.id} />;
} 