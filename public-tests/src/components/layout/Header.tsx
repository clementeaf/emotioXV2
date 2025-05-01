import { Menu, Bell } from 'lucide-react';
import { HeaderProps } from './types';

const userInfo = {
  initials: 'AC',
};

// TODO: Reemplazar con título de página dinámico
const pageTitle = "Admin Dashboard";

export function Header({ openMobileSidebar }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-4 sticky top-0 z-30 flex-shrink-0">
      {/* Botón para abrir sidebar en móvil */}
      <button
        className="lg:hidden text-neutral-500 hover:text-neutral-700 p-1 -ml-1 mr-3"
        onClick={openMobileSidebar}
        aria-label="Abrir menú lateral"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Título de la página (podría ser dinámico) */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-neutral-900 truncate">{pageTitle}</h1>
      </div>

      {/* Acciones del Header (Notificaciones, Usuario móvil) */}
      <div className="ml-auto flex items-center space-x-4">
        {/* TODO: Implementar funcionalidad de notificaciones */}
        <button className="relative text-neutral-500 hover:text-neutral-700 p-1" aria-label="Notificaciones">
          <Bell className="w-5 h-5" />
          {/* Indicador de notificación (ejemplo) */}
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
        </button>

        {/* Avatar de usuario en móvil (oculto en desktop) */}
        <div className="flex items-center lg:hidden">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {userInfo.initials}
          </div>
        </div>
      </div>
    </header>
  );
} 