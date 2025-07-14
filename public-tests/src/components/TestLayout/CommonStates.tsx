export function LoadingState() {
  return <div className='flex flex-col items-center justify-center h-full'>Cargando datos...</div>;
}

export function ErrorState() {
  return <div className='flex flex-col items-center justify-center h-full text-red-500'>Error al cargar datos</div>;
}

export function EmptyState() {
  return <div className='flex flex-col items-center justify-center h-full'>No hay datos</div>;
}
