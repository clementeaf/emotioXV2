import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  ChevronDown, 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  Menu,
  X,
  LogOut,
  Bell,
} from 'lucide-react';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  hasSubMenu?: boolean;
  onClick?: () => void;
}

function NavLink({ to, icon, label, active, hasSubMenu, onClick }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active 
          ? 'bg-primary-50 text-primary-700'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      )}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span className="flex-1">{label}</span>
      {hasSubMenu && <ChevronDown className="w-4 h-4" />}
    </Link>
  );
}

interface SidebarProps {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

function Sidebar({ isMobileSidebarOpen, setIsMobileSidebarOpen }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          'fixed inset-y-0 left-0 bg-white border-r border-neutral-200 w-64 z-50 transition-transform lg:translate-x-0 lg:static lg:z-0 flex-shrink-0',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="h-16 flex items-center px-4 border-b border-neutral-200">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-semibold text-primary-600">EmotioX</span>
            </Link>
            <button 
              className="ml-auto lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              <NavLink
                to="/"
                icon={<LayoutDashboard className="w-5 h-5" />}
                label="Dashboard"
                active={pathname === '/'}
              />
              <NavLink
                to="/users"
                icon={<Users className="w-5 h-5" />}
                label="Usuarios"
                active={pathname.startsWith('/users')}
              />
              <NavLink
                to="/analytics"
                icon={<BarChart3 className="w-5 h-5" />}
                label="Analíticas"
                active={pathname.startsWith('/analytics')}
              />
              <NavLink
                to="/reports"
                icon={<FileText className="w-5 h-5" />}
                label="Reportes"
                active={pathname.startsWith('/reports')}
              />
              <NavLink
                to="/settings"
                icon={<Settings className="w-5 h-5" />}
                label="Configuración"
                active={pathname.startsWith('/settings')}
              />
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  AC
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-900">Admin User</p>
                <p className="text-xs text-neutral-500">admin@emotio.com</p>
              </div>
              <button className="ml-auto text-neutral-400 hover:text-neutral-600">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

interface HeaderProps {
  openMobileSidebar: () => void;
}

function Header({ openMobileSidebar }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-4 sticky top-0 z-30">
      <button
        className="lg:hidden text-neutral-500 hover:text-neutral-700"
        onClick={openMobileSidebar}
      >
        <Menu className="w-5 h-5" />
      </button>
      
      <div className="ml-4 lg:ml-0">
        <h1 className="text-lg font-semibold text-neutral-900">Admin Dashboard</h1>
      </div>

      <div className="ml-auto flex items-center space-x-4">
        <button className="relative text-neutral-500 hover:text-neutral-700">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>
        
        {/* Usuario en móvil (oculto en desktop porque ya está en el sidebar) */}
        <div className="flex items-center lg:hidden">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            AC
          </div>
        </div>
      </div>
    </header>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar 
        isMobileSidebarOpen={isMobileSidebarOpen} 
        setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col">
        <Header openMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 