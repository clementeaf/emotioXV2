import { AuthDebugger } from '@/components/auth/AuthDebugger';
import { LogViewer } from '@/components/utils/ErrorLogger';
import { Toaster } from 'react-hot-toast';

export const DevTools = () => {
  return (
    <>
      <Toaster position="top-right" />
      <LogViewer />
      <AuthDebugger />
    </>
  );
};
