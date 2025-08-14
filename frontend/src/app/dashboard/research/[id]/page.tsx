import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Para soporte de export estático
export async function generateStaticParams() {
  // Generar parámetros estáticos para las rutas conocidas
  return [
    { id: 'demo' },
    { id: 'test' },
    { id: 'example' }
  ];
}

export default async function ResearchPage({ params }: PageProps) {
  const { id } = await params;

  // Redirigir a la página de respuestas agrupadas por defecto
  redirect(`/dashboard/research/${id}/grouped-responses`);
}
