'use client';

import { useAuth } from '@/providers/AuthProvider';

export function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-6 border-b border-neutral-200/70">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Dashboard
            </h1>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Cerrar sesión
            </button>
          </div>
          <p className="mt-2 text-neutral-600">
            Bienvenido, {user?.name || user?.email}
          </p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Aquí puedes agregar el contenido del dashboard */}
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium text-blue-900">Investigaciones</h3>
              <p className="mt-2 text-blue-600">Gestiona tus investigaciones activas</p>
            </div>
            <div className="p-6 bg-green-50 rounded-lg border border-green-100">
              <h3 className="text-lg font-medium text-green-900">Participantes</h3>
              <p className="mt-2 text-green-600">Administra los participantes de tus estudios</p>
            </div>
            <div className="p-6 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="text-lg font-medium text-purple-900">Resultados</h3>
              <p className="mt-2 text-purple-600">Visualiza los resultados de tus investigaciones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 