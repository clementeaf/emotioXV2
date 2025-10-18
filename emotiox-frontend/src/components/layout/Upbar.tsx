import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import { Button } from '../commons';
import { getUserName, getUserInitials } from '../../utils/userUtils';
import type { UpbarProps } from './types';

const Upbar: React.FC<UpbarProps> = ({
  user
}) => {
  const navigate = useNavigate();
  const userName = getUserName(user || null);
  const userInitials = getUserInitials(user || null);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_type');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_type');
    
    navigate('/login');
  };

  return (
    <Card className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">{userInitials}</span>
            </div>
            <span className="text-sm text-gray-600">{userName}</span>
          </div>
          
          <Button
            onClick={handleLogout}
            className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Upbar;
