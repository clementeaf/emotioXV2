import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { mainNavigationItems } from '../../config/navigation';

interface NavigationMenuProps {
  isCollapsed: boolean;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ isCollapsed }) => {
  const location = useLocation();

  return (
    <nav className="p-4 space-y-1">
      {mainNavigationItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-full transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-6 h-6" />
            {!isCollapsed && <span className="flex-1">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationMenu;
