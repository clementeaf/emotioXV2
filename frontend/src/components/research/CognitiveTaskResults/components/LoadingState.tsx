'use client';


interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Cargando resultados...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600 text-lg">{message}</p>
      <p className="text-gray-400 text-sm mt-2">Esto puede tomar unos segundos</p>
    </div>
  );
}
