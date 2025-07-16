import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Crear el cliente de Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

// --- INICIO: Lógica de actualización automática de versión ---
const BUILD_HASH = import.meta.env?.VITE_BUILD_HASH || '';

function getMetaBuildHash(html: string): string | null {
  const match = html.match(/<meta name="build-hash" content="([^"]+)"/);
  return match ? match[1] : null;
}

async function checkForUpdates() {
  try {
    const response = await fetch(window.location.href, { cache: 'no-cache' });
    const html = await response.text();
    const newBuildHash = getMetaBuildHash(html);

    if (newBuildHash && newBuildHash !== BUILD_HASH) {
      console.log('🔄 Nueva versión detectada, recargando...');
      window.location.reload();
    }
  } catch (error) {
    console.warn('Error checking for updates:', error);
  }
}

// Chequear cada 60 segundos
// --- FIN: Lógica de actualización automática de versión ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // Comentado temporalmente para debug
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  // </React.StrictMode>
)
