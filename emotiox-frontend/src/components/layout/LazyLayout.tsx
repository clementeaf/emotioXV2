import React, { Suspense, lazy, useState, useEffect } from 'react';
import { LoadingPage } from '../commons';

const Upbar = lazy(() => import('./Upbar'));
const Sidebar = lazy(() => import('./Sidebar'));
const MainContent = lazy(() => import('./MainContent'));

interface LazyLayoutProps {
  children: React.ReactNode;
}

const LazyLayout: React.FC<LazyLayoutProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('[LAZY_LAYOUT] Usuario parseado:', parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="flex-1 flex">
        <Suspense fallback={<LoadingPage message="Cargando sidebar..." showCard={false} />}>
          <Sidebar />
        </Suspense>

        <div className="flex-1 flex flex-col">
          <Suspense fallback={<LoadingPage message="Cargando barra superior..." showCard={false} />}>
            <Upbar user={user || undefined} />
          </Suspense>

          <Suspense fallback={<LoadingPage message="Cargando contenido..." showCard={false} />}>
            <MainContent>
              {children}
            </MainContent>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LazyLayout;
