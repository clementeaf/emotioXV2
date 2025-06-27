import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { NavLinkProps } from '../../types/flow.types';

export function NavLink({ to, icon, label, active, hasSubMenu, onClick }: NavLinkProps) {
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
