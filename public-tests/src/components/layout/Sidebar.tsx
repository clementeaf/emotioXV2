import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  FileText,
  X,
  LogOut,
} from 'lucide-react';
import { NavLink } from './NavLink'; // Importar NavLink

interface SidebarProps {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

// TODO: Mover esta configuración a un archivo de constantes o recibirla como prop
const navItems = [
  { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { to: '/users', icon: <Users className="w-5 h-5" />, label: 'Usuarios' },
  { to: '/analytics', icon: <BarChart3 className="w-5 h-5" />, label: 'Analíticas' },
  { to: '/reports', icon: <FileText className="w-5 h-5" />, label: 'Reportes' },
  { to: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Configuración' },
];

// TODO: Reemplazar con datos reales del usuario (contexto/estado)
const userInfo = {
  initials: 'AC',
  name: 'Admin User',
  email: 'admin@emotio.com',
};

export function Sidebar({ isMobileSidebarOpen, setIsMobileSidebarOpen }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true" // Mejor para accesibilidad
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 bg-white border-r border-neutral-200 w-64 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 flex-shrink-0',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar principal"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="h-16 flex items-center px-4 border-b border-neutral-200 flex-shrink-0">
            <Link to="/" className="flex items-center">
              {/* TODO: Considerar usar un logo SVG si existe */}
              <span className="text-xl font-semibold text-primary-600">EmotioX</span>
            </Link>
            <button
              className="ml-auto lg:hidden p-1 -mr-1 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Cerrar menú lateral"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Sidebar content: Mapeo de navItems */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to} // La key va aquí
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))} // Lógica de activo mejorada
                />
              ))}
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-neutral-200 flex-shrink-0">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {userInfo.initials}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-900 truncate" title={userInfo.name}>{userInfo.name}</p>
                <p className="text-xs text-neutral-500 truncate" title={userInfo.email}>{userInfo.email}</p>
              </div>
              {/* TODO: Implementar la funcionalidad de logout */}
              <button className="ml-auto text-neutral-400 hover:text-neutral-600 p-1" aria-label="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
} 