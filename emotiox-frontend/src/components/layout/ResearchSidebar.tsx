import React, { memo, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { researchSections } from '../../config/navigation';
import { getUserFromStorage, getUserName, getUserInitials } from '../../utils/userUtils';
import { Button } from '../commons';
import type { ResearchSidebarProps } from './types';

/**
 * ResearchSidebar - Sidebar específico para investigaciones
 * Se muestra cuando el usuario está dentro de una investigación específica
 */
const ResearchSidebar: React.FC<ResearchSidebarProps> = ({ 
  researchId, 
  isCollapsed = false, 
  onToggle 
}) => {
  const [searchParams] = useSearchParams();
  const currentSection = searchParams.get('section') || 'overview';

  const user = useMemo(() => getUserFromStorage(), []);
  const sections = useMemo(() => researchSections, []);

  const UserInfo = memo(() => {
    const userName = getUserName(user);
    const userInitial = getUserInitials(user);
    
    return (
      <div className="flex items-center gap-3 p-3">
        <div className="w-12 h-12 rounded-full bg-blue-300 flex items-center justify-center">
          <span className="text-lg font-medium text-blue-900">{userInitial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-md font-medium text-neutral-900 truncate">{userName}</p>
          <p className="text-sm text-neutral-500 truncate">Investigación #{researchId}</p>
        </div>
      </div>
    );
  });

  const TopBlock = useMemo(() => (
    <div className="px-6 pt-4 pb-3 border-b border-neutral-200">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          Investigación #{researchId}
        </h2>
        <p className="text-sm text-neutral-600">
          Estado: En progreso
        </p>
      </div>
    </div>
  ), [researchId]);

  const MenuBlock = useMemo(() => (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="space-y-1">
          <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {section.title}
            </h3>
          </div>
          {section.stages?.map((stage) => (
            <Link
              key={stage.id}
              to={`/dashboard?research=${researchId}&section=${stage.id}`}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full transition-colors ${
                currentSection === stage.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <stage.icon className="w-5 h-5" />
              <span className="flex-1">{stage.title}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  ), [sections, researchId, currentSection]);

  return (
    <aside className={`bg-white rounded-lg shadow-lg transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">←</span>
            {!isCollapsed && <span>Comprimir</span>}
          </Button>
        </div>

      <div className="px-6 pt-8 pb-6">
        <UserInfo />
      </div>

      {!isCollapsed && TopBlock}

      <div className="flex-1 overflow-y-auto px-2 py-4 ml-4">
        {!isCollapsed && MenuBlock}
      </div>

        <div className="p-4 border-t border-neutral-200">
            <Button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('auth_type');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('auth_type');
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <span>Cerrar Sesión</span>
            </Button>
        </div>
    </aside>
  );
};

export default ResearchSidebar;
