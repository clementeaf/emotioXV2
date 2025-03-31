import { ErrorLogProvider, LogViewer } from '@/components/utils/ErrorLogger';
import { Toaster } from '@/components/ui/use-toast';
import { AppProps } from 'next/app';

function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorLogProvider>
      <Toaster />
      <Component {...pageProps} />
      <LogViewer />
    </ErrorLogProvider>
  );
}

export default App; 