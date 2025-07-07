import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from 'react'
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

function checkForUpdate() {
  fetch(window.location.pathname || '/', { cache: 'reload' })
    .then(res => res.text())
    .then(html => {
      const serverHash = getMetaBuildHash(html);
      if (serverHash && serverHash !== BUILD_HASH) {
        showUpdateBanner();
      }
    });
}

function showUpdateBanner() {
  if (document.getElementById('update-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.position = 'fixed';
  banner.style.bottom = '0';
  banner.style.left = '0';
  banner.style.right = '0';
  banner.style.background = '#222';
  banner.style.color = '#fff';
  banner.style.padding = '16px';
  banner.style.textAlign = 'center';
  banner.style.zIndex = '9999';
  banner.innerHTML = 'Hay una nueva versión disponible. <button id="update-btn" style="margin-left:12px;padding:6px 16px;background:#fff;color:#222;border:none;border-radius:4px;cursor:pointer;">Recargar</button>';
  document.body.appendChild(banner);
  document.getElementById('update-btn')?.addEventListener('click', () => {
    window.location.reload();
  });
}

setInterval(checkForUpdate, 60 * 1000); // Chequear cada 60 segundos
// --- FIN: Lógica de actualización automática de versión ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
// Force redeploy Mon Jul  7 15:55:26 -04 2025
