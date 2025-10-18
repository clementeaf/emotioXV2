import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from './layout';
import { getUserFromStorage } from '../utils/userUtils';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<{ name: string; initials: string } | null>(null);
  const [searchParams] = useSearchParams();

  const researchId = searchParams.get('research');

  useEffect(() => {
    const userData = getUserFromStorage();
    setUser(userData);
  }, []);

  return (
    <Layout user={user || undefined} researchId={researchId}>
      {children}
    </Layout>
  );
};

export default LayoutWrapper;
